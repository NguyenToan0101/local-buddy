package localbuddy.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import localbuddy.backend.dto.BookingDto;
import localbuddy.backend.dto.BookingItineraryRequest;
import localbuddy.backend.dto.BookingRequest;
import localbuddy.backend.dto.CancellationRequest;
import localbuddy.backend.dto.QrTokenResponse;
import localbuddy.backend.dto.ReviewDto;
import localbuddy.backend.dto.ReviewRequest;
import localbuddy.backend.model.entity.Booking;
import localbuddy.backend.model.entity.BuddyProfile;
import localbuddy.backend.model.entity.Cancellation;
import localbuddy.backend.model.entity.Review;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.model.enums.BookingStatus;
import localbuddy.backend.model.enums.MeetupStatus;
import localbuddy.backend.model.enums.UserRole;
import localbuddy.backend.repository.BookingRepository;
import localbuddy.backend.repository.BuddyProfileRepository;
import localbuddy.backend.repository.CancellationRepository;
import localbuddy.backend.repository.ExperienceRepository;
import localbuddy.backend.repository.ReviewRepository;
import localbuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final ZoneId BOOKING_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    private static final String BOOKING_TYPE_PLANNED_ROUTE = "PLANNED_ROUTE";
    private static final String BOOKING_TYPE_CONSULTATION = "CONSULTATION";
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final BuddyProfileRepository buddyProfileRepository;
    private final NotificationService notificationService;
    private final ReviewRepository reviewRepository;
    private final ExperienceRepository experienceRepository;
    private final CancellationRepository cancellationRepository;

    @Transactional(readOnly = true)
    public Page<BookingDto> getBookings(UUID currentUserId, Pageable pageable) {
        return bookingRepository.findByTravelerIdOrBuddyIdOrderByStartTimeDesc(currentUserId, currentUserId, pageable)
                .map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public BookingDto getBooking(UUID currentUserId, UUID bookingId) {
        return mapToDto(getBookingForParticipant(currentUserId, bookingId));
    }

    @Transactional(readOnly = true)
    public BookingDto getLiveBooking(UUID currentUserId, UUID bookingId) {
        Booking booking = getBookingForParticipant(currentUserId, bookingId);
        if (booking.getMeetupStatus() != MeetupStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Live experience is available only after the trip has started.");
        }
        return mapToDto(booking);
    }

    @Transactional
    public BookingDto createBooking(UUID currentUserId, BookingRequest request) {
        User traveler = getUser(currentUserId);
        User buddy = getUser(request.getBuddyId());

        if (traveler.getRole() != UserRole.TRAVELER) {
            throw new IllegalArgumentException("Only travelers can create direct bookings.");
        }
        if (buddy.getRole() != UserRole.BUDDY) {
            throw new IllegalArgumentException("Target user is not a buddy.");
        }

        return mapToDto(createPendingBooking(traveler, buddy, request));
    }

    @Transactional
    public BookingDto updateStatus(UUID currentUserId, UUID bookingId, String status) {
        Booking booking = getBookingForParticipant(currentUserId, bookingId);
        BookingStatus nextStatus = BookingStatus.valueOf(status.toUpperCase());
        if (nextStatus == BookingStatus.CONFIRMED) {
            throw new IllegalArgumentException("Bookings are confirmed only after traveler payment succeeds.");
        }
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException("Only pending bookings can be updated manually.");
        }
        if (nextStatus == BookingStatus.REJECTED) {
            requireBuddy(currentUserId, booking);
        } else if (nextStatus == BookingStatus.CANCELLED) {
            throw new IllegalArgumentException("Use the cancellation endpoint so a reason can be recorded.");
        } else if (nextStatus != BookingStatus.PENDING) {
            throw new IllegalArgumentException("Unsupported manual booking status.");
        }
        booking.setStatus(nextStatus);
        booking.setUpdatedAt(nowInBookingZone());
        return mapToDto(bookingRepository.save(booking));
    }

    @Transactional
    public BookingDto updateItinerary(UUID currentUserId, UUID bookingId, BookingItineraryRequest request) {
        Booking booking = getBookingForParticipant(currentUserId, bookingId);
        requireBuddy(currentUserId, booking);
        throw new IllegalArgumentException("Traveler-created bookings are read-only for buddies.");
    }

    @Transactional
    public BookingDto cancel(UUID currentUserId, UUID bookingId, CancellationRequest request) {
        Booking booking = getBookingForParticipant(currentUserId, bookingId);
        if (request == null || !StringUtils.hasText(request.getReason())) {
            throw new IllegalArgumentException("Cancellation reason is required.");
        }
        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new IllegalArgumentException("Completed bookings cannot be cancelled.");
        }
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            return mapToDto(booking);
        }
        if (booking.getMeetupStatus() == MeetupStatus.IN_PROGRESS || booking.getMeetupStatus() == MeetupStatus.COMPLETED) {
            throw new IllegalArgumentException("Trips that have started cannot be cancelled.");
        }

        OffsetDateTime now = nowInBookingZone();
        BigDecimal total = booking.getTotalPrice() != null ? booking.getTotalPrice() : BigDecimal.ZERO;
        OffsetDateTime noRefundAfter = booking.getStartTime().atZoneSameInstant(BOOKING_ZONE).toOffsetDateTime().minusHours(24);
        BigDecimal cancellationFee = now.isAfter(noRefundAfter) ? total : BigDecimal.ZERO;
        BigDecimal refund = total.subtract(cancellationFee).max(BigDecimal.ZERO);

        Cancellation cancellation = cancellationRepository.findByBookingId(bookingId).orElseGet(Cancellation::new);
        cancellation.setBooking(booking);
        cancellation.setCancelledByUser(getUser(currentUserId));
        cancellation.setReason(request.getReason().trim());
        cancellation.setCancellationFee(cancellationFee);
        cancellation.setRefundAmount(refund);
        cancellation.setCreatedAt(now);
        cancellationRepository.save(cancellation);

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setUpdatedAt(now);
        Booking saved = bookingRepository.save(booking);

        User recipient = booking.getTraveler().getId().equals(currentUserId) ? booking.getBuddy() : booking.getTraveler();
        notificationService.createBookingNotification(
                recipient,
                getUser(currentUserId),
                "booking_cancelled",
                "Booking cancelled",
                "Booking " + booking.getTitle() + " has been cancelled.",
                booking.getId(),
                recipient.getRole() == UserRole.BUDDY ? "/buddy/dashboard/trips" : "/traveller/booking/" + booking.getId()
        );

        return mapToDto(saved);
    }

    @Transactional
    public BookingDto markTravelerArrived(UUID currentUserId, UUID bookingId) {
        Booking booking = getBookingForParticipant(currentUserId, bookingId);
        requireTraveler(currentUserId, booking);
        requireConfirmedAndArrivalWindow(booking);

        MeetupStatus status = booking.getMeetupStatus() != null ? booking.getMeetupStatus() : MeetupStatus.NOT_STARTED;
        if (status == MeetupStatus.BUDDY_ARRIVED || status == MeetupStatus.BOTH_ARRIVED) {
            booking.setMeetupStatus(MeetupStatus.BOTH_ARRIVED);
        } else if (status == MeetupStatus.NOT_STARTED || status == MeetupStatus.TRAVELER_ARRIVED) {
            booking.setMeetupStatus(MeetupStatus.TRAVELER_ARRIVED);
        } else {
            throw new IllegalArgumentException("Traveler arrival cannot be marked after the trip has started.");
        }
        booking.setUpdatedAt(nowInBookingZone());
        return mapToDto(bookingRepository.save(booking));
    }

    @Transactional
    public BookingDto markBuddyArrived(UUID currentUserId, UUID bookingId) {
        Booking booking = getBookingForParticipant(currentUserId, bookingId);
        requireBuddy(currentUserId, booking);
        requireConfirmedAndArrivalWindow(booking);

        MeetupStatus status = booking.getMeetupStatus() != null ? booking.getMeetupStatus() : MeetupStatus.NOT_STARTED;
        if (status == MeetupStatus.TRAVELER_ARRIVED || status == MeetupStatus.BOTH_ARRIVED) {
            booking.setMeetupStatus(MeetupStatus.BOTH_ARRIVED);
        } else if (status == MeetupStatus.NOT_STARTED || status == MeetupStatus.BUDDY_ARRIVED) {
            booking.setMeetupStatus(MeetupStatus.BUDDY_ARRIVED);
        } else {
            throw new IllegalArgumentException("Buddy arrival cannot be marked after the trip has started.");
        }
        booking.setUpdatedAt(nowInBookingZone());
        return mapToDto(bookingRepository.save(booking));
    }

    @Transactional
    public QrTokenResponse getQrToken(UUID currentUserId, UUID bookingId) {
        Booking booking = getBookingForParticipant(currentUserId, bookingId);
        requireTraveler(currentUserId, booking);
        if (booking.getMeetupStatus() != MeetupStatus.BOTH_ARRIVED) {
            throw new IllegalArgumentException("QR token is available only after both participants have arrived.");
        }

        OffsetDateTime now = nowInBookingZone();
        if (!StringUtils.hasText(booking.getMeetupQrToken())
                || booking.getMeetupQrExpiresAt() == null
                || !booking.getMeetupQrExpiresAt().isAfter(now.plusSeconds(30))) {
            booking.setMeetupQrToken(UUID.randomUUID().toString() + UUID.randomUUID());
            booking.setMeetupQrExpiresAt(now.plusMinutes(10));
            booking.setUpdatedAt(now);
            bookingRepository.save(booking);
        }
        return buildQrResponse(booking);
    }

    @Transactional
    public BookingDto startWithQr(UUID currentUserId, UUID bookingId, String qrToken) {
        Booking booking = getBookingForParticipant(currentUserId, bookingId);
        requireBuddy(currentUserId, booking);
        if (booking.getMeetupStatus() != MeetupStatus.BOTH_ARRIVED) {
            throw new IllegalArgumentException("Both participants must arrive before starting the trip.");
        }

        String token = extractToken(qrToken);
        if (!StringUtils.hasText(token)
                || !Objects.equals(token, booking.getMeetupQrToken())
                || booking.getMeetupQrExpiresAt() == null
                || !booking.getMeetupQrExpiresAt().isAfter(nowInBookingZone())) {
            throw new IllegalArgumentException("QR token is invalid or expired.");
        }

        OffsetDateTime liveStartedAt = nowInBookingZone();
        booking.setMeetupStatus(MeetupStatus.IN_PROGRESS);
        booking.setLiveStartedAt(liveStartedAt);
        booking.setMeetupQrToken(null);
        booking.setMeetupQrExpiresAt(null);
        booking.setUpdatedAt(liveStartedAt);
        Booking saved = bookingRepository.save(booking);
        notificationService.createBookingNotification(
                booking.getTraveler(),
                booking.getBuddy(),
                "trip_started",
                "Trip started",
                "Chuyến đi " + booking.getTitle() + " đã bắt đầu.",
                booking.getId(),
                "/traveller/booking/" + booking.getId()
        );
        notificationService.createBookingNotification(
                booking.getBuddy(),
                booking.getTraveler(),
                "trip_started",
                "Trip started",
                "Chuyến đi " + booking.getTitle() + " đã bắt đầu.",
                booking.getId(),
                "/buddy/live/" + booking.getId()
        );
        return mapToDto(saved);
    }

    @Transactional
    public BookingDto complete(UUID currentUserId, UUID bookingId) {
        Booking booking = getBookingForParticipant(currentUserId, bookingId);
        if (booking.getMeetupStatus() != MeetupStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Only in-progress trips can be completed.");
        }
        booking.setMeetupStatus(MeetupStatus.COMPLETED);
        booking.setStatus(BookingStatus.COMPLETED);
        booking.setUpdatedAt(nowInBookingZone());
        Booking saved = bookingRepository.save(booking);
        notificationService.createBookingNotification(
                booking.getTraveler(),
                booking.getBuddy(),
                "review_request",
                "Trip completed",
                "Chuyến đi " + booking.getTitle() + " đã kết thúc. Hãy đánh giá buddy của bạn.",
                booking.getId(),
                "/traveller/review/" + booking.getId()
        );
        return mapToDto(saved);
    }

    @Transactional
    public ReviewDto createReview(UUID currentUserId, UUID bookingId, ReviewRequest request) {
        Booking booking = getBookingForParticipant(currentUserId, bookingId);
        requireTraveler(currentUserId, booking);
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new IllegalArgumentException("Only completed bookings can be reviewed.");
        }
        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5.");
        }
        if (reviewRepository.existsByBookingIdAndReviewerId(bookingId, currentUserId)) {
            throw new IllegalArgumentException("This booking has already been reviewed.");
        }

        Review review = new Review();
        review.setBooking(booking);
        review.setReviewer(booking.getTraveler());
        review.setReviewee(booking.getBuddy());
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setIsPublic(request.getIsPublic() == null || request.getIsPublic());
        review.setCreatedAt(nowInBookingZone());
        Review saved = reviewRepository.save(review);
        updateBuddyRating(booking.getBuddy().getId(), request.getRating());
        return mapReviewToDto(saved);
    }

    @Transactional
    public Booking createPendingBooking(User traveler, User buddy, BookingRequest request) {
        if (traveler.getRole() != UserRole.TRAVELER || buddy.getRole() != UserRole.BUDDY) {
            throw new IllegalArgumentException("Booking must be between a traveler and a buddy.");
        }

        int hours = resolveHours(request.getHours(), request.getDuration());
        OffsetDateTime startTime = resolveStartTime(request.getDate(), request.getTime());
        OffsetDateTime endTime = startTime.plusHours(hours);
        BigDecimal price = request.getPrice() != null ? request.getPrice() : calculateDefaultPrice(buddy, hours);
        String title = firstText(request.getTitle(), "Custom Experience");

        Booking booking = new Booking();
        booking.setTraveler(traveler);
        booking.setBuddy(buddy);
        booking.setTitle(title);
        booking.setDescription(request.getDescription());
        booking.setBookingType(resolveBookingType(request.getBookingType()));
        booking.setMeetingPoint(trimOrNull(request.getMeetingPoint()));
        List<String> stops = normalizeRouteStops(request.getRouteStops());
        validateRouteStops(booking.getMeetingPoint(), stops, booking.getBookingType());
        booking.setRouteStops(writeRouteStops(stops));
        booking.setItineraryNotes(trimOrNull(request.getItineraryNotes()));
        booking.setStartTime(startTime);
        booking.setEndTime(endTime);
        booking.setTotalHours(hours);
        booking.setGuestCount(request.getGuests() != null && request.getGuests() > 0 ? request.getGuests() : 1);
        booking.setTotalPrice(price);
        booking.setStatus(BookingStatus.PENDING);
        booking.setMeetupStatus(MeetupStatus.NOT_STARTED);
        OffsetDateTime now = nowInBookingZone();
        booking.setCreatedAt(now);
        booking.setUpdatedAt(now);
        return bookingRepository.save(booking);
    }

    public BookingDto mapToDto(Booking booking) {
        OffsetDateTime startTime = booking.getStartTime() != null
                ? booking.getStartTime().atZoneSameInstant(BOOKING_ZONE).toOffsetDateTime()
                : null;

        return BookingDto.builder()
                .id(booking.getId())
                .userId(booking.getTraveler().getId())
                .buddyId(booking.getBuddy().getId())
                .traveler(booking.getTraveler().getFullName())
                .travelerAvatar(AvatarService.getDisplayAvatarUrl(booking.getTraveler()))
                .buddyName(booking.getBuddy().getFullName())
                .buddyAvatar(AvatarService.getDisplayAvatarUrl(booking.getBuddy()))
                .title(booking.getTitle())
                .description(booking.getDescription())
                .bookingType(booking.getBookingType())
                .meetingPoint(booking.getMeetingPoint())
                .routeStops(readRouteStops(booking.getRouteStops()))
                .itineraryNotes(booking.getItineraryNotes())
                .date(startTime != null ? startTime.format(DATE_FORMATTER) : "")
                .time(startTime != null ? startTime.format(TIME_FORMATTER) : "")
                .hours(booking.getTotalHours())
                .guests(booking.getGuestCount())
                .price(booking.getTotalPrice())
                .totalPrice(booking.getTotalPrice())
                .status(booking.getStatus() != null ? booking.getStatus().name() : "PENDING")
                .meetupStatus(booking.getMeetupStatus() != null ? booking.getMeetupStatus().name() : "NOT_STARTED")
                .liveStartedAt(resolveLiveStartedAt(booking))
                .hasReview(booking.getId() != null
                        && booking.getTraveler() != null
                        && reviewRepository.existsByBookingIdAndReviewerId(booking.getId(), booking.getTraveler().getId()))
                .hasExperienceShare(booking.getId() != null && experienceRepository.existsByBookingId(booking.getId()))
                .build();
    }

    private String resolveLiveStartedAt(Booking booking) {
        if (booking.getLiveStartedAt() != null) {
            return booking.getLiveStartedAt().atZoneSameInstant(BOOKING_ZONE).toOffsetDateTime().toString();
        }
        if (booking.getMeetupStatus() == MeetupStatus.IN_PROGRESS && booking.getUpdatedAt() != null) {
            return booking.getUpdatedAt().atZoneSameInstant(BOOKING_ZONE).toOffsetDateTime().toString();
        }
        return null;
    }

    private Booking getBookingForParticipant(UUID currentUserId, UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found."));
        boolean participant = booking.getTraveler().getId().equals(currentUserId)
                || booking.getBuddy().getId().equals(currentUserId);
        if (!participant) {
            throw new IllegalArgumentException("You are not allowed to access this booking.");
        }
        return booking;
    }

    private void requireTraveler(UUID currentUserId, Booking booking) {
        if (!booking.getTraveler().getId().equals(currentUserId)) {
            throw new IllegalArgumentException("Only the traveler can perform this action.");
        }
    }

    private void requireBuddy(UUID currentUserId, Booking booking) {
        if (!booking.getBuddy().getId().equals(currentUserId)) {
            throw new IllegalArgumentException("Only the buddy can perform this action.");
        }
    }

    private void requireConfirmedAndArrivalWindow(Booking booking) {
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalArgumentException("Arrival can be marked only for confirmed bookings.");
        }
        OffsetDateTime allowedFrom = booking.getStartTime().atZoneSameInstant(BOOKING_ZONE).toOffsetDateTime().minusHours(2);
        if (nowInBookingZone().isBefore(allowedFrom)) {
            throw new IllegalArgumentException("Arrival can be marked within 2 hours before the trip starts.");
        }
    }

    private QrTokenResponse buildQrResponse(Booking booking) {
        String payload = "local-buddy://booking/" + booking.getId() + "/start?token=" + booking.getMeetupQrToken();
        return QrTokenResponse.builder()
                .token(booking.getMeetupQrToken())
                .expiresAt(booking.getMeetupQrExpiresAt())
                .qrPayload(payload)
                .build();
    }

    private String extractToken(String qrToken) {
        if (!StringUtils.hasText(qrToken)) {
            return null;
        }
        String trimmed = qrToken.trim();
        if (!trimmed.startsWith("local-buddy://")) {
            return trimmed;
        }
        try {
            URI uri = URI.create(trimmed);
            String query = uri.getQuery();
            if (!StringUtils.hasText(query)) {
                return null;
            }
            for (String part : query.split("&")) {
                String[] pieces = part.split("=", 2);
                if (pieces.length == 2 && pieces[0].equals("token")) {
                    return pieces[1];
                }
            }
        } catch (IllegalArgumentException ignored) {
            return null;
        }
        return null;
    }

    private void updateBuddyRating(UUID buddyUserId, short rating) {
        buddyProfileRepository.findByUserId(buddyUserId).ifPresent(profile -> {
            int reviewCount = profile.getReviewCount() != null ? profile.getReviewCount() : 0;
            BigDecimal currentRating = profile.getRating() != null ? profile.getRating() : BigDecimal.ZERO;
            BigDecimal total = currentRating.multiply(BigDecimal.valueOf(reviewCount)).add(BigDecimal.valueOf(rating));
            int nextCount = reviewCount + 1;
            profile.setRating(total.divide(BigDecimal.valueOf(nextCount), 1, RoundingMode.HALF_UP));
            profile.setReviewCount(nextCount);
            profile.setUpdatedAt(nowInBookingZone());
            buddyProfileRepository.save(profile);
        });
    }

    private ReviewDto mapReviewToDto(Review review) {
        return ReviewDto.builder()
                .id(review.getId())
                .bookingId(review.getBooking().getId())
                .reviewerId(review.getReviewer().getId())
                .revieweeId(review.getReviewee().getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .isPublic(review.getIsPublic())
                .createdAt(review.getCreatedAt())
                .build();
    }

    private User getUser(UUID userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID is required.");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
    }

    private int resolveHours(Integer hours, String duration) {
        if (hours != null && hours > 0) {
            return hours;
        }
        if (StringUtils.hasText(duration)) {
            String normalized = duration.trim().toLowerCase();
            if (normalized.contains("full")) {
                return 8;
            }
            String number = normalized.replaceAll("[^0-9]", "");
            if (StringUtils.hasText(number)) {
                return Math.max(1, Integer.parseInt(number));
            }
        }
        return 1;
    }

    private OffsetDateTime resolveStartTime(LocalDate date, String time) {
        if (date == null) {
            throw new IllegalArgumentException("Booking date is required.");
        }
        LocalDate localDate = date;
        LocalTime localTime = StringUtils.hasText(time)
                ? LocalTime.parse(time)
                : LocalTime.of(9, 0);
        return localDate.atTime(localTime).atZone(BOOKING_ZONE).toOffsetDateTime();
    }

    private OffsetDateTime nowInBookingZone() {
        return OffsetDateTime.now(BOOKING_ZONE);
    }

    private BigDecimal calculateDefaultPrice(User buddy, int hours) {
        return buddyProfileRepository.findByUserId(buddy.getId())
                .map(BuddyProfile::getHourlyRate)
                .orElse(BigDecimal.ZERO)
                .multiply(BigDecimal.valueOf(hours));
    }

    private String firstText(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }
        return "";
    }

    private String resolveBookingType(String bookingType) {
        if (!StringUtils.hasText(bookingType)) {
            return BOOKING_TYPE_PLANNED_ROUTE;
        }
        String normalized = bookingType.trim().toUpperCase();
        if (!BOOKING_TYPE_PLANNED_ROUTE.equals(normalized) && !BOOKING_TYPE_CONSULTATION.equals(normalized)) {
            throw new IllegalArgumentException("Booking type must be PLANNED_ROUTE or CONSULTATION.");
        }
        return normalized;
    }

    private List<String> normalizeRouteStops(List<String> stops) {
        if (stops == null) {
            return List.of();
        }
        return stops.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .limit(20)
                .toList();
    }

    private void validateRouteStops(String meetingPoint, List<String> stops, String bookingType) {
        if (BOOKING_TYPE_PLANNED_ROUTE.equals(bookingType) && !StringUtils.hasText(meetingPoint) && stops.isEmpty()) {
            throw new IllegalArgumentException("Meeting point or at least one route stop is required for planned route bookings.");
        }
    }

    private String writeRouteStops(List<String> stops) {
        try {
            return OBJECT_MAPPER.writeValueAsString(stops != null ? stops : List.of());
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Route stops could not be saved.");
        }
    }

    private List<String> readRouteStops(String routeStops) {
        if (!StringUtils.hasText(routeStops)) {
            return List.of();
        }
        try {
            return OBJECT_MAPPER.readValue(routeStops, STRING_LIST_TYPE);
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private String trimOrNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
