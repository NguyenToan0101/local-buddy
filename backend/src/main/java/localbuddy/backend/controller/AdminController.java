package localbuddy.backend.controller;

import jakarta.validation.Valid;
import localbuddy.backend.dto.AdminDashboardStatsDto;
import localbuddy.backend.dto.AdminVerificationDto;
import localbuddy.backend.dto.AdminVerificationUpdateRequest;
import localbuddy.backend.model.entity.BuddyProfile;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.model.enums.UserRole;
import localbuddy.backend.model.enums.VerificationStatus;
import localbuddy.backend.repository.BuddyProfileRepository;
import localbuddy.backend.repository.UserRepository;
import localbuddy.backend.service.AvatarService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private final UserRepository userRepository;
    private final BuddyProfileRepository buddyProfileRepository;

    @GetMapping("/users")
    public List<AdminVerificationDto> getUsers() {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::mapVerification)
                .toList();
    }

    @GetMapping("/buddies/pending")
    public List<AdminVerificationDto> getPendingBuddies() {
        return buddyProfileRepository.findAll().stream()
                .filter(profile -> profile.getVerificationStatus() == VerificationStatus.PENDING)
                .map(profile -> mapVerification(profile.getUser(), profile))
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
                .pendingVerifications(buddyProfiles.stream().filter(profile -> profile.getVerificationStatus() == VerificationStatus.PENDING).count())
                .verifiedBuddies(buddyProfiles.stream().filter(profile -> profile.getVerificationStatus() == VerificationStatus.VERIFIED).count())
                .rejectedBuddies(buddyProfiles.stream().filter(profile -> profile.getVerificationStatus() == VerificationStatus.REJECTED).count())
                .build();
    }

    @PatchMapping("/buddies/{userId}/verification")
    public AdminVerificationDto updateBuddyVerification(
            @PathVariable UUID userId,
            @Valid @RequestBody AdminVerificationUpdateRequest request
    ) {
        BuddyProfile profile = buddyProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Buddy profile not found for user: " + userId));

        profile.setVerificationStatus(VerificationStatus.valueOf(request.getStatus().toUpperCase()));
        profile.setUpdatedAt(OffsetDateTime.now());
        BuddyProfile saved = buddyProfileRepository.save(profile);

        return mapVerification(saved.getUser(), saved);
    }

    private AdminVerificationDto mapVerification(User user) {
        BuddyProfile profile = user.getRole() == UserRole.BUDDY
                ? buddyProfileRepository.findByUserId(user.getId()).orElse(null)
                : null;
        return mapVerification(user, profile);
    }

    private AdminVerificationDto mapVerification(User user, BuddyProfile profile) {
        boolean buddy = user.getRole() == UserRole.BUDDY;
        String avatar = AvatarService.getDisplayAvatarUrl(user);
        String front = profile != null ? profile.getIdCardFrontUrl() : null;
        String back = profile != null ? profile.getIdCardBackUrl() : null;

        return AdminVerificationDto.builder()
                .id(user.getId())
                .name(user.getFullName())
                .type(buddy ? "Buddy" : "Traveller")
                .regDate(formatDate(user.getCreatedAt()))
                .docType(buddy ? "CCCD" : "Passport")
                .status(resolveStatus(user, profile))
                .avatar(avatar)
                .docs(AdminVerificationDto.Documents.builder()
                        .front(front)
                        .back(back)
                        .selfie(firstText(front, avatar))
                        .build())
                .email(user.getEmail())
                .phone(user.getPhone())
                .build();
    }

    private String resolveStatus(User user, BuddyProfile profile) {
        if (user.getRole() != UserRole.BUDDY) {
            return Boolean.TRUE.equals(user.getIsActive()) ? "Verified" : "Pending";
        }
        VerificationStatus status = profile != null && profile.getVerificationStatus() != null
                ? profile.getVerificationStatus()
                : VerificationStatus.PENDING;
        return switch (status) {
            case VERIFIED -> "Verified";
            case REJECTED -> "Rejected";
            case PENDING -> "Pending";
        };
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
