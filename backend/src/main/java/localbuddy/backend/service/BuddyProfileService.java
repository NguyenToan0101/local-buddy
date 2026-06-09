package localbuddy.backend.service;

import localbuddy.backend.dto.BuddyProfileDto;
import localbuddy.backend.model.entity.BuddyProfile;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.model.enums.UserRole;
import localbuddy.backend.model.enums.VerificationStatus;
import localbuddy.backend.repository.BuddyProfileRepository;
import localbuddy.backend.repository.UserRepository;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BuddyProfileService {

    private final BuddyProfileRepository buddyProfileRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;

    @Transactional(readOnly = true)
    public BuddyProfileDto getProfileByUserId(UUID userId) {
        BuddyProfile buddyProfile = buddyProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Buddy profile not found for user: " + userId));
        
        User user = buddyProfile.getUser();

        return mapToDto(buddyProfile, user);
    }

    @Transactional
    public BuddyProfileDto updateProfile(UUID userId, BuddyProfileDto dto, UUID currentUserId, boolean currentUserAdmin) {
        if (!currentUserAdmin && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("You are not allowed to update this buddy profile.");
        }

        BuddyProfile buddyProfile = buddyProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Buddy profile not found for user: " + userId));

        User user = buddyProfile.getUser();

        // 1. Update User details
        if (dto.getName() != null) user.setFullName(dto.getName());
        if (dto.getPhone() != null) user.setPhone(dto.getPhone());
        if (dto.getImage() != null) {
            user.setAvatarUrl(cloudinaryService.uploadBase64ImageIfNeeded(
                    dto.getImage(),
                    "local-buddy/users/" + userId + "/avatar"
            ));
        }
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
        if (dto.getIdCardFront() != null) {
            buddyProfile.setIdCardFrontUrl(cloudinaryService.uploadBase64ImageIfNeeded(
                    dto.getIdCardFront(),
                    "local-buddy/users/" + userId + "/verification"
            ));
        }
        if (dto.getIdCardBack() != null) {
            buddyProfile.setIdCardBackUrl(cloudinaryService.uploadBase64ImageIfNeeded(
                    dto.getIdCardBack(),
                    "local-buddy/users/" + userId + "/verification"
            ));
        }

        if (currentUserAdmin && dto.getVerificationStatus() != null) {
            try {
                buddyProfile.setVerificationStatus(VerificationStatus.valueOf(dto.getVerificationStatus().toUpperCase()));
            } catch (Exception ignored) {}
        }
        buddyProfile.setUpdatedAt(OffsetDateTime.now());
        BuddyProfile savedProfile = buddyProfileRepository.save(buddyProfile);

        return mapToDto(savedProfile, user);
    }

    @Transactional
    public BuddyProfileDto updateAvatar(UUID userId, MultipartFile file, UUID currentUserId, boolean currentUserAdmin) {
        if (!currentUserAdmin && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("You are not allowed to update this buddy profile.");
        }
        BuddyProfile buddyProfile = buddyProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Buddy profile not found for user: " + userId));
        User user = buddyProfile.getUser();
        String avatarUrl = cloudinaryService.uploadImage(file, "local-buddy/users/" + userId + "/avatar");
        user.setAvatarUrl(avatarUrl);
        user.setUpdatedAt(OffsetDateTime.now());
        userRepository.save(user);
        return mapToDto(buddyProfile, user);
    }

    @Transactional
    public BuddyProfileDto updateIdCard(UUID userId, String side, MultipartFile file, UUID currentUserId, boolean currentUserAdmin) {
        if (!currentUserAdmin && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("You are not allowed to update this buddy profile.");
        }
        BuddyProfile buddyProfile = buddyProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Buddy profile not found for user: " + userId));
        String normalizedSide = side == null ? "" : side.trim().toLowerCase();
        String imageUrl = cloudinaryService.uploadImage(file, "local-buddy/users/" + userId + "/verification");
        if ("front".equals(normalizedSide)) {
            buddyProfile.setIdCardFrontUrl(imageUrl);
        } else if ("back".equals(normalizedSide)) {
            buddyProfile.setIdCardBackUrl(imageUrl);
        } else {
            throw new IllegalArgumentException("ID card side must be front or back.");
        }
        buddyProfile.setVerificationStatus(VerificationStatus.PENDING);
        buddyProfile.setUpdatedAt(OffsetDateTime.now());
        BuddyProfile savedProfile = buddyProfileRepository.save(buddyProfile);
        return mapToDto(savedProfile, savedProfile.getUser());
    }

    @Transactional(readOnly = true)
    public List<BuddyProfileDto> getAllBuddies() {
        return buddyProfileRepository.findAll().stream()
                .filter(profile -> Boolean.TRUE.equals(profile.getUser().getIsActive()) && profile.getUser().getRole() == UserRole.BUDDY)
                .map(profile -> mapToDto(profile, profile.getUser()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<BuddyProfileDto> searchBuddies(String searchQuery, List<String> tags, BigDecimal rating, Pageable pageable) {
        return buddyProfileRepository.findAll(buildSearchSpecification(searchQuery, tags, rating), pageable)
                .map(profile -> mapToDto(profile, profile.getUser()));
    }

    private Specification<BuddyProfile> buildSearchSpecification(String searchQuery, List<String> tags, BigDecimal rating) {
        return (root, query, cb) -> {
            Join<BuddyProfile, User> user = root.join("user");
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.isTrue(user.get("isActive")));
            predicates.add(cb.equal(user.get("role"), UserRole.BUDDY));
            predicates.add(cb.isNull(user.get("deletedAt")));

            if (StringUtils.hasText(searchQuery)) {
                String pattern = "%" + searchQuery.trim().toLowerCase() + "%";
                Expression<String> tagsText = cb.lower(cb.function("array_to_string", String.class, root.get("tags"), cb.literal(",")));
                Expression<String> interestsText = cb.lower(cb.function("array_to_string", String.class, root.get("interests"), cb.literal(",")));
                Expression<String> languagesText = cb.lower(cb.function("array_to_string", String.class, root.get("languages"), cb.literal(",")));

                predicates.add(cb.or(
                        cb.like(cb.lower(user.get("fullName")), pattern),
                        cb.like(cb.lower(root.get("bio")), pattern),
                        cb.like(cb.lower(root.get("location")), pattern),
                        cb.like(tagsText, pattern),
                        cb.like(interestsText, pattern),
                        cb.like(languagesText, pattern)
                ));
            }

            List<String> normalizedTags = normalizeFilters(tags);
            if (!normalizedTags.isEmpty()) {
                Expression<String> tagsText = cb.lower(cb.function("array_to_string", String.class, root.get("tags"), cb.literal(",")));
                Expression<String> interestsText = cb.lower(cb.function("array_to_string", String.class, root.get("interests"), cb.literal(",")));
                List<Predicate> tagPredicates = normalizedTags.stream()
                        .map(tag -> {
                            String pattern = "%" + tag + "%";
                            return cb.or(cb.like(tagsText, pattern), cb.like(interestsText, pattern));
                        })
                        .toList();
                predicates.add(cb.or(tagPredicates.toArray(Predicate[]::new)));
            }

            if (rating != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("rating"), rating));
            }

            query.orderBy(cb.desc(root.get("rating")), cb.desc(root.get("createdAt")));
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private List<String> normalizeFilters(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream()
                .flatMap(value -> List.of(value.split(",")).stream())
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(String::toLowerCase)
                .toList();
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
