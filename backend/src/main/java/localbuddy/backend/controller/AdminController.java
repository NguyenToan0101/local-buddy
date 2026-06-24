package localbuddy.backend.controller;

import jakarta.validation.Valid;
import localbuddy.backend.dto.AdminDashboardStatsDto;
import localbuddy.backend.dto.AdminVerificationDto;
import localbuddy.backend.dto.AdminVerificationUpdateRequest;
import localbuddy.backend.dto.BookingDto;
import localbuddy.backend.model.entity.Booking;
import localbuddy.backend.model.entity.BuddyProfile;
import localbuddy.backend.model.entity.TouristProfile;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.model.enums.UserRole;
import localbuddy.backend.model.enums.VerificationStatus;
import localbuddy.backend.repository.BookingRepository;
import localbuddy.backend.repository.BuddyProfileRepository;
import localbuddy.backend.repository.TouristProfileRepository;
import localbuddy.backend.repository.UserRepository;
import localbuddy.backend.dto.EarningsTransactionDto;
import localbuddy.backend.service.AvatarService;
import localbuddy.backend.service.BookingService;
import localbuddy.backend.service.BuddyProfileService;
import localbuddy.backend.service.EarningsService;
import localbuddy.backend.service.TouristProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private final UserRepository userRepository;
    private final BuddyProfileRepository buddyProfileRepository;
    private final TouristProfileRepository touristProfileRepository;
    private final BookingRepository bookingRepository;
    private final BookingService bookingService;
    private final BuddyProfileService buddyProfileService;
    private final EarningsService earningsService;
    private final TouristProfileService touristProfileService;

    @GetMapping("/users")
    public List<AdminVerificationDto> getUsers() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() != UserRole.ADMIN)  // Exclude ADMIN users
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::mapVerification)
                .toList();
    }

    @GetMapping("/buddies/pending")
    public List<AdminVerificationDto> getPendingBuddies() {
        return buddyProfileRepository.findAll().stream()
                .filter(profile -> isManualReviewStatus(profile.getVerificationStatus()))
                .map(profile -> mapVerification(profile.getUser(), profile))
                .toList();
    }

    @GetMapping("/verifications")
    public List<AdminVerificationDto> getVerifications(@RequestParam(required = false) String status) {
        VerificationStatus filterStatus = status != null && !status.isBlank()
                ? VerificationStatus.valueOf(status.trim().toUpperCase())
                : null;

        List<AdminVerificationDto> buddyVerifications = buddyProfileRepository.findAll().stream()
                .filter(profile -> filterStatus == null || profile.getVerificationStatus() == filterStatus)
                .map(profile -> mapVerification(profile.getUser(), profile))
                .toList();
        List<AdminVerificationDto> travelerVerifications = touristProfileRepository.findAll().stream()
                .filter(profile -> filterStatus == null || profile.getVerificationStatus() == filterStatus)
                .map(profile -> mapVerification(profile.getUser(), null, profile))
                .toList();

        return java.util.stream.Stream.concat(buddyVerifications.stream(), travelerVerifications.stream())
                .sorted(Comparator.comparing(AdminVerificationDto::getRegDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    @GetMapping("/dashboard/stats")
    public AdminDashboardStatsDto getDashboardStats() {
        List<User> users = userRepository.findAll();
        List<BuddyProfile> buddyProfiles = buddyProfileRepository.findAll();

        return AdminDashboardStatsDto.builder()
                .users(users.size())
                .travelers(users.stream().filter(user -> user.getRole() == UserRole.TRAVELER).count())
                .buddies(users.stream().filter(user -> user.getRole() == UserRole.BUDDY).count())
                .pendingVerifications(buddyProfiles.stream().filter(profile -> isManualReviewStatus(profile.getVerificationStatus())).count())
                .verifiedBuddies(buddyProfiles.stream().filter(profile -> isApprovedStatus(profile.getVerificationStatus())).count())
                .rejectedBuddies(buddyProfiles.stream().filter(profile -> isRejectedStatus(profile.getVerificationStatus())).count())
                .build();
    }

    @GetMapping("/earnings/transactions")
    public Map<String, List<EarningsTransactionDto>> getAllEarningsTransactions() {
        return Map.of("transactions", earningsService.getAllTransactions());
    }

    @GetMapping("/bookings")
    public List<BookingDto> getAllBookings() {
        List<Booking> bookings = bookingRepository.findAll();
        return bookings.stream()
                .sorted(Comparator.comparing(Booking::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(bookingService::mapToDto)
                .toList();
    }

    @PatchMapping("/buddies/{userId}/verification")
    public AdminVerificationDto updateBuddyVerification(
            @PathVariable UUID userId,
            @Valid @RequestBody AdminVerificationUpdateRequest request
    ) {
        BuddyProfile saved = buddyProfileService.applyManualVerification(userId, request.getStatus(), request.getReason());

        return mapVerification(saved.getUser(), saved);
    }

    @PatchMapping("/travelers/{userId}/verification")
    public Map<String, String> updateTravelerVerification(
            @PathVariable UUID userId,
            @Valid @RequestBody AdminVerificationUpdateRequest request
    ) {
        touristProfileService.updateVerificationStatus(userId, request.getStatus());
        return Map.of("status", request.getStatus().toLowerCase());
    }

    private AdminVerificationDto mapVerification(User user) {
        BuddyProfile profile = user.getRole() == UserRole.BUDDY
                ? buddyProfileRepository.findByUserId(user.getId()).orElse(null)
                : null;
        TouristProfile touristProfile = user.getRole() == UserRole.TRAVELER
                ? touristProfileRepository.findByUserId(user.getId()).orElse(null)
                : null;
        return mapVerification(user, profile, touristProfile);
    }

    private AdminVerificationDto mapVerification(User user, BuddyProfile profile) {
        return mapVerification(user, profile, null);
    }

    private AdminVerificationDto mapVerification(User user, BuddyProfile profile, TouristProfile touristProfile) {
        String userType = mapUserRoleToType(user.getRole());
        boolean buddy = user.getRole() == UserRole.BUDDY;
        boolean traveler = user.getRole() == UserRole.TRAVELER;
        String avatar = AvatarService.getDisplayAvatarUrl(user);
        String front = profile != null ? profile.getIdCardFrontUrl() : null;
        String back = profile != null ? profile.getIdCardBackUrl() : null;
        String travelerEvidence = touristProfile != null ? touristProfile.getEVisaEvidenceUrl() : null;

        return AdminVerificationDto.builder()
                .id(user.getId())
                .name(user.getFullName())
                .age(profile != null && profile.getAge() != null ? profile.getAge().intValue() : null)
                .type(userType)
                .regDate(formatDate(user.getCreatedAt()))
                .docType(buddy ? "CCCD" : traveler ? "E-Visa" : "Passport")
                .status(resolveStatus(user, profile, touristProfile))
                .avatar(avatar)
                .docs(AdminVerificationDto.Documents.builder()
                        .front(buddy ? front : travelerEvidence)
                        .back(back)
                        .selfie(firstText(profile != null ? profile.getSelfieUrl() : null, avatar))
                        .build())
                .email(user.getEmail())
                .phone(user.getPhone())
                .eVisaNumber(touristProfile != null ? touristProfile.getEVisaNumber() : null)
                .eVisaCountry(touristProfile != null ? touristProfile.getEVisaCountry() : null)
                .eVisaExpiryDate(touristProfile != null ? touristProfile.getEVisaExpiryDate() : null)
                .extractedFullName(profile != null ? profile.getExtractedFullName() : null)
                .extractedIdNumber(profile != null ? profile.getExtractedIdNumber() : null)
                .extractedDateOfBirth(profile != null ? profile.getExtractedDateOfBirth() : null)
                .ocrScore(profile != null ? profile.getOcrScore() : null)
                .faceMatchScore(profile != null ? profile.getFaceMatchScore() : null)
                .livenessScore(profile != null ? profile.getLivenessScore() : null)
                .verificationScore(profile != null ? profile.getVerificationScore() : null)
                .rejectionReason(profile != null ? profile.getRejectionReason() : null)
                .autoVerificationMessage(profile != null ? profile.getAutoVerificationMessage() : null)
                .qualityScore(profile != null ? profile.getQualityScore() : null)
                .antiSpoofScore(profile != null ? profile.getAntiSpoofScore() : null)
                .riskScore(profile != null ? profile.getRiskScore() : null)
                .riskReason(profile != null ? profile.getRiskReason() : null)
                .duplicateDetected(profile != null ? profile.getDuplicateDetected() : null)
                .duplicateUserId(profile != null ? profile.getDuplicateUserId() : null)
                .livenessDetails(profile != null ? profile.getLivenessDetails() : null)
                .antiSpoofDetails(profile != null ? profile.getAntiSpoofDetails() : null)
                .build();
    }

    private String mapUserRoleToType(UserRole role) {
        return switch (role) {
            case BUDDY -> "Buddy";
            case ADMIN -> "Admin";
            case TRAVELER -> "Traveller";
        };
    }

    private String resolveStatus(User user, BuddyProfile profile, TouristProfile touristProfile) {
        if (user.getRole() == UserRole.TRAVELER) {
            VerificationStatus status = touristProfile != null && touristProfile.getVerificationStatus() != null
                    ? touristProfile.getVerificationStatus()
                    : null;
            if (status == null) {
                return "Unverified";
            }
            return switch (status) {
                case VERIFIED, AUTO_APPROVED, MANUAL_APPROVED -> "Verified";
                case REJECTED, AUTO_REJECTED, MANUAL_REJECTED -> "Rejected";
                case PROCESSING -> "Processing";
                case MANUAL_REVIEW -> "Manual Review";
                case PENDING -> "Pending";
            };
        }
        if (user.getRole() != UserRole.BUDDY) {
            return Boolean.TRUE.equals(user.getIsActive()) ? "Verified" : "Pending";
        }
        VerificationStatus status = profile != null && profile.getVerificationStatus() != null
                ? profile.getVerificationStatus()
                : VerificationStatus.PENDING;
        return switch (status) {
            case VERIFIED, AUTO_APPROVED, MANUAL_APPROVED -> "Verified";
            case REJECTED, AUTO_REJECTED, MANUAL_REJECTED -> "Rejected";
            case PROCESSING -> "Processing";
            case MANUAL_REVIEW -> "Manual Review";
            case PENDING -> "Pending";
        };
    }

    private boolean isManualReviewStatus(VerificationStatus status) {
        return status == VerificationStatus.MANUAL_REVIEW;
    }

    private boolean isApprovedStatus(VerificationStatus status) {
        return status == VerificationStatus.VERIFIED
                || status == VerificationStatus.AUTO_APPROVED
                || status == VerificationStatus.MANUAL_APPROVED;
    }

    private boolean isRejectedStatus(VerificationStatus status) {
        return status == VerificationStatus.REJECTED
                || status == VerificationStatus.AUTO_REJECTED
                || status == VerificationStatus.MANUAL_REJECTED;
    }

    private String formatDate(OffsetDateTime dateTime) {
        return dateTime != null ? dateTime.format(DATE_FORMATTER) : "N/A";
    }

    private String firstText(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }
}
