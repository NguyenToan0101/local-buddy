package localbuddy.backend.service;

import localbuddy.backend.dto.BookingDto;
import localbuddy.backend.dto.BookingRequest;
import localbuddy.backend.model.entity.Booking;
import localbuddy.backend.model.entity.BuddyProfile;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.model.enums.BookingStatus;
import localbuddy.backend.model.enums.MeetupStatus;
import localbuddy.backend.model.enums.UserRole;
import localbuddy.backend.repository.BookingRepository;
import localbuddy.backend.repository.BuddyProfileRepository;
import localbuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final ZoneId BOOKING_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final BuddyProfileRepository buddyProfileRepository;

    @Transactional(readOnly = true)
    public Page<BookingDto> getBookings(UUID currentUserId, Pageable pageable) {
        return bookingRepository.findByTravelerIdOrBuddyIdOrderByStartTimeDesc(currentUserId, currentUserId, pageable)
                .map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public BookingDto getBooking(UUID currentUserId, UUID bookingId) {
        return mapToDto(getBookingForParticipant(currentUserId, bookingId));
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
        booking.setStatus(BookingStatus.valueOf(status.toUpperCase()));
        booking.setUpdatedAt(nowInBookingZone());
        return mapToDto(bookingRepository.save(booking));
    }

    @Transactional
    public BookingDto updateMeetupStatus(UUID currentUserId, UUID bookingId, String status) {
        Booking booking = getBookingForParticipant(currentUserId, bookingId);
        booking.setMeetupStatus(status != null ? MeetupStatus.valueOf(status.toUpperCase()) : MeetupStatus.NOT_STARTED);
        booking.setUpdatedAt(nowInBookingZone());
        return mapToDto(bookingRepository.save(booking));
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
        String activity = firstText(request.getActivity(), request.getTitle(), "Custom Experience");
        String title = firstText(request.getTitle(), activity);

        Booking booking = new Booking();
        booking.setTraveler(traveler);
        booking.setBuddy(buddy);
        booking.setTitle(title);
        booking.setDescription(request.getDescription());
        booking.setLocation(firstText(request.getLocation(), "To be confirmed"));
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
                .activity(booking.getTitle())
                .description(booking.getDescription())
                .location(booking.getLocation())
                .date(startTime != null ? startTime.format(DATE_FORMATTER) : "")
                .time(startTime != null ? startTime.format(TIME_FORMATTER) : "")
                .hours(booking.getTotalHours())
                .guests(booking.getGuestCount())
                .price(booking.getTotalPrice())
                .totalPrice(booking.getTotalPrice())
                .status(booking.getStatus() != null ? booking.getStatus().name() : "PENDING")
                .meetupStatus(booking.getMeetupStatus() != null ? booking.getMeetupStatus().name() : "NOT_STARTED")
                .build();
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

    private OffsetDateTime resolveStartTime(String date, String time) {
        LocalDate localDate = StringUtils.hasText(date)
                ? LocalDate.parse(date)
                : LocalDate.now(BOOKING_ZONE).plusDays(1);
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
}
