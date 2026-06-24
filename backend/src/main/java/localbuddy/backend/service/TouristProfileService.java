package localbuddy.backend.service;

import localbuddy.backend.dto.TouristProfileRequest;
import localbuddy.backend.dto.TouristProfileResponse;
import localbuddy.backend.model.entity.TouristProfile;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.model.enums.VerificationStatus;
import localbuddy.backend.repository.TouristProfileRepository;
import localbuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class TouristProfileService {

    private final TouristProfileRepository touristProfileRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;

    public TouristProfileResponse createProfile(UUID userId, TouristProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (touristProfileRepository.existsByUserId(userId)) {
            return updateProfile(userId, request);
        }

        TouristProfile profile = new TouristProfile();
        profile.setUser(user);
        profile.setNationality(request.getNationality());
        profile.setBio(request.getBio());
        profile.setLanguages(request.getLanguages());
        profile.setInterests(request.getInterests());
        profile.setEVisaNumber(request.getEVisaNumber());
        profile.setEVisaCountry(request.getEVisaCountry());
        profile.setEVisaExpiryDate(request.getEVisaExpiryDate());
        if (request.getEVisaEvidence() != null) {
            profile.setEVisaEvidenceUrl(cloudinaryService.uploadBase64ImageIfNeeded(
                    request.getEVisaEvidence(),
                    "local-buddy/users/" + userId + "/traveler-evisa"
            ));
        }
        profile.setVerificationStatus(VerificationStatus.PENDING);

        TouristProfile savedProfile = touristProfileRepository.save(profile);
        
        return mapToResponse(savedProfile);
    }

    public TouristProfileResponse updateProfile(UUID userId, TouristProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TouristProfile profile = touristProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Tourist profile not found"));

        // Update profile fields
        if (request.getNationality() != null) {
            profile.setNationality(request.getNationality());
        }
        if (request.getBio() != null) {
            profile.setBio(request.getBio());
        }
        if (request.getLanguages() != null) {
            profile.setLanguages(request.getLanguages());
        }
        if (request.getInterests() != null) {
            profile.setInterests(request.getInterests());
        }
        if (request.getEVisaNumber() != null) {
            profile.setEVisaNumber(request.getEVisaNumber());
        }
        if (request.getEVisaCountry() != null) {
            profile.setEVisaCountry(request.getEVisaCountry());
        }
        if (request.getEVisaExpiryDate() != null) {
            profile.setEVisaExpiryDate(request.getEVisaExpiryDate());
        }
        if (request.getEVisaEvidence() != null) {
            profile.setEVisaEvidenceUrl(cloudinaryService.uploadBase64ImageIfNeeded(
                    request.getEVisaEvidence(),
                    "local-buddy/users/" + userId + "/traveler-evisa"
            ));
        }
        if (profile.getVerificationStatus() == null) {
            profile.setVerificationStatus(VerificationStatus.PENDING);
        }

        TouristProfile savedProfile = touristProfileRepository.save(profile);
        return mapToResponse(savedProfile);
    }

    public TouristProfileResponse updateVerificationStatus(UUID userId, String status) {
        TouristProfile profile = touristProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Tourist profile not found"));

        profile.setVerificationStatus(normalizeTravelerStatus(status));
        TouristProfile savedProfile = touristProfileRepository.save(profile);
        return mapToResponse(savedProfile);
    }

    @Scheduled(
            fixedDelayString = "${app.traveler.auto-approve-delay-ms:60000}",
            initialDelayString = "${app.traveler.auto-approve-initial-delay-ms:60000}"
    )
    public void autoApprovePendingProfiles() {
        OffsetDateTime cutoff = OffsetDateTime.now().minusMinutes(5);
        List<TouristProfile> pendingProfiles = touristProfileRepository
                .findByVerificationStatusAndUpdatedAtBefore(VerificationStatus.PENDING, cutoff).stream()
                .filter(this::isCompletedProfile)
                .toList();
        if (pendingProfiles.isEmpty()) {
            return;
        }

        pendingProfiles.forEach(profile -> profile.setVerificationStatus(VerificationStatus.VERIFIED));
        touristProfileRepository.saveAll(pendingProfiles);
    }

    @Transactional(readOnly = true)
    public TouristProfileResponse getProfile(UUID userId) {
        TouristProfile profile = touristProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Tourist profile not found"));
        return mapToResponse(profile);
    }

    @Transactional(readOnly = true)
    public boolean hasProfile(UUID userId) {
        return touristProfileRepository.findByUserId(userId)
                .map(this::isCompletedProfile)
                .orElse(false);
    }

    public void deleteProfile(UUID userId) {
        TouristProfile profile = touristProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Tourist profile not found"));
        touristProfileRepository.delete(profile);
    }

    private TouristProfileResponse mapToResponse(TouristProfile profile) {
        User user = profile.getUser();
        return TouristProfileResponse.builder()
                .id(profile.getId())
                .userId(user.getId())
                .nationality(profile.getNationality())
                .bio(profile.getBio())
                .languages(profile.getLanguages())
                .interests(profile.getInterests())
                .eVisaNumber(profile.getEVisaNumber())
                .eVisaCountry(profile.getEVisaCountry())
                .eVisaExpiryDate(profile.getEVisaExpiryDate())
                .eVisaEvidence(profile.getEVisaEvidenceUrl())
                .verificationStatus(profile.getVerificationStatus() != null ? profile.getVerificationStatus().name().toLowerCase() : "pending")
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatarUrl(AvatarService.getDisplayAvatarUrl(user)) // Final display avatar
                .build();
    }

    private VerificationStatus normalizeTravelerStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase();
        return switch (normalized) {
            case "VERIFIED", "MANUAL_APPROVED" -> VerificationStatus.VERIFIED;
            case "REJECTED", "MANUAL_REJECTED" -> VerificationStatus.REJECTED;
            case "PENDING" -> VerificationStatus.PENDING;
            default -> throw new IllegalArgumentException("Unsupported traveler verification status.");
        };
    }

    private boolean isCompletedProfile(TouristProfile profile) {
        return hasText(profile.getNationality())
                && hasText(profile.getBio())
                && profile.getLanguages() != null
                && !profile.getLanguages().isEmpty()
                && profile.getInterests() != null
                && !profile.getInterests().isEmpty();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
