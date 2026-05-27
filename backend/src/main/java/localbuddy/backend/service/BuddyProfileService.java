package localbuddy.backend.service;

import localbuddy.backend.dto.BuddyProfileDto;
import localbuddy.backend.model.entity.BuddyProfile;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.model.enums.UserRole;
import localbuddy.backend.model.enums.VerificationStatus;
import localbuddy.backend.repository.BuddyProfileRepository;
import localbuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BuddyProfileService {

    private final BuddyProfileRepository buddyProfileRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public BuddyProfileDto getProfileByUserId(UUID userId) {
        BuddyProfile buddyProfile = buddyProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Buddy profile not found for user: " + userId));
        
        User user = buddyProfile.getUser();

        return mapToDto(buddyProfile, user);
    }

    @Transactional
    public BuddyProfileDto updateProfile(UUID userId, BuddyProfileDto dto) {
        BuddyProfile buddyProfile = buddyProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Buddy profile not found for user: " + userId));

        User user = buddyProfile.getUser();

        // 1. Update User details
        if (dto.getName() != null) user.setFullName(dto.getName());
        if (dto.getPhone() != null) user.setPhone(dto.getPhone());
        if (dto.getImage() != null) user.setAvatarUrl(dto.getImage());
        user.setUpdatedAt(OffsetDateTime.now());
        userRepository.save(user);

        // 2. Update Buddy specific details
        if (dto.getAge() != null) buddyProfile.setAge(dto.getAge().shortValue());
        if (dto.getLocation() != null) buddyProfile.setLocation(dto.getLocation());
        if (dto.getPrice() != null) buddyProfile.setHourlyRate(dto.getPrice());
        if (dto.getDescription() != null) buddyProfile.setBio(dto.getDescription());
        if (dto.getLanguages() != null) buddyProfile.setLanguages(dto.getLanguages());
        if (dto.getTags() != null) buddyProfile.setTags(dto.getTags());
        if (dto.getInterests() != null) buddyProfile.setInterests(dto.getInterests());
        if (dto.getIdCardFront() != null) buddyProfile.setIdCardFrontUrl(dto.getIdCardFront());
        if (dto.getIdCardBack() != null) buddyProfile.setIdCardBackUrl(dto.getIdCardBack());

        if (dto.getVerificationStatus() != null) {
            try {
                buddyProfile.setVerificationStatus(VerificationStatus.valueOf(dto.getVerificationStatus().toUpperCase()));
            } catch (Exception ignored) {}
        }
        buddyProfile.setUpdatedAt(OffsetDateTime.now());
        BuddyProfile savedProfile = buddyProfileRepository.save(buddyProfile);

        return mapToDto(savedProfile, user);
    }

    @Transactional(readOnly = true)
    public List<BuddyProfileDto> getAllBuddies() {
        return buddyProfileRepository.findAll().stream()
                .filter(profile -> Boolean.TRUE.equals(profile.getUser().getIsActive()) && profile.getUser().getRole() == UserRole.BUDDY)
                .map(profile -> mapToDto(profile, profile.getUser()))
                .collect(Collectors.toList());
    }

    private BuddyProfileDto mapToDto(BuddyProfile profile, User user) {
        return BuddyProfileDto.builder()
                .id(user.getId()) // Matches user.id expected by settings frontend
                .name(user.getFullName())
                .age(profile.getAge() != null ? profile.getAge().intValue() : null)
                .location(profile.getLocation())
                .rating(profile.getRating())
                .reviewCount(profile.getReviewCount())
                .languages(profile.getLanguages())
                .description(profile.getBio())
                .image(AvatarService.getDisplayAvatarUrl(user))
                .tags(profile.getTags())
                .interests(profile.getInterests())
                .price(profile.getHourlyRate())
                .phone(user.getPhone())
                .idCardFront(profile.getIdCardFrontUrl())
                .idCardBack(profile.getIdCardBackUrl())
                .verificationStatus(profile.getVerificationStatus() != null ? profile.getVerificationStatus().name().toLowerCase() : "unverified")
                .build();
    }
}
