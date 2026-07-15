package localbuddy.backend.service;

import jakarta.persistence.criteria.Expression;
import localbuddy.backend.dto.ExperienceDto;
import localbuddy.backend.model.entity.Booking;
import localbuddy.backend.model.entity.Experience;
import localbuddy.backend.model.entity.ExperienceImage;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.repository.BookingRepository;
import localbuddy.backend.repository.ExperienceImageRepository;
import localbuddy.backend.repository.ExperienceRepository;
import localbuddy.backend.repository.UserRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExperienceService {

    private static final ZoneId EXPERIENCE_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final String DEFAULT_IMAGE = "/assets/img/hoian.jpg";

    private final ExperienceRepository experienceRepository;
    private final ExperienceImageRepository experienceImageRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final CloudinaryService cloudinaryService;

    @Transactional(readOnly = true)
    public List<ExperienceDto> getAllExperiences(UUID buddyId) {
        List<Experience> experiences = buddyId != null
                ? experienceRepository.findByBuddyIdOrderByCreatedAtDesc(buddyId)
                : experienceRepository.findAllByOrderByCreatedAtDesc();
        return experiences.stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ExperienceDto getExperience(UUID experienceId) {
        return mapToDto(getExperienceEntity(experienceId));
    }

    @Transactional(readOnly = true)
    public Page<ExperienceDto> searchExperiences(
            String searchQuery,
            List<String> tags,
            String duration,
            Short rating,
            Pageable pageable
    ) {
        return experienceRepository.findAll(buildSearchSpecification(searchQuery, tags, duration, rating), pageable)
                .map(this::mapToDto);
    }

    @Transactional
    public ExperienceDto createExperience(UUID currentUserId, ExperienceDto dto) {
        User traveler = getUser(currentUserId);
        User buddy = getUser(dto.getBuddyId());
        Booking booking = null;
        if (dto.getBookingId() != null) {
            if (experienceRepository.existsByBookingId(dto.getBookingId())) {
                throw new IllegalArgumentException("This booking already has a shared experience.");
            }
            booking = bookingRepository.findById(dto.getBookingId())
                    .orElseThrow(() -> new IllegalArgumentException("Booking not found."));
            if (!booking.getTraveler().getId().equals(currentUserId)) {
                throw new IllegalArgumentException("You are not allowed to share this booking.");
            }
            if (!booking.getBuddy().getId().equals(dto.getBuddyId())) {
                throw new IllegalArgumentException("Shared experience buddy must match the booking buddy.");
            }
        }

        Experience experience = new Experience();
        experience.setTraveler(traveler);
        experience.setBuddy(buddy);
        experience.setBooking(booking);
        applyDto(experience, dto);
        experience.setCreatedAt(nowInExperienceZone());
        experience.setIsPinned(Boolean.TRUE.equals(dto.getPinned()));

        Experience saved = experienceRepository.save(experience);
        saveImage(saved, dto.getImage());
        return mapToDto(saved);
    }

    @Transactional
    public ExperienceDto updateExperience(UUID currentUserId, UUID experienceId, ExperienceDto dto) {
        Experience experience = getExperienceEntity(experienceId);
        if (!experience.getTraveler().getId().equals(currentUserId)) {
            throw new IllegalArgumentException("You are not allowed to update this experience.");
        }

        if (dto.getBuddyId() != null && !dto.getBuddyId().equals(experience.getBuddy().getId())) {
            experience.setBuddy(getUser(dto.getBuddyId()));
        }

        applyDto(experience, dto);
        Experience saved = experienceRepository.save(experience);
        if (dto.getImage() != null) {
            experienceImageRepository.deleteByExperienceId(saved.getId());
            saveImage(saved, dto.getImage());
        }
        return mapToDto(saved);
    }

    @Transactional
    public ExperienceDto updateExperienceImage(UUID currentUserId, UUID experienceId, MultipartFile file, Integer displayOrder) {
        Experience experience = getExperienceEntity(experienceId);
        if (!experience.getTraveler().getId().equals(currentUserId)) {
            throw new IllegalArgumentException("You are not allowed to update this experience.");
        }
        String originalFilename = file.getOriginalFilename();
        String imageUrl;
        if (originalFilename != null && (originalFilename.toLowerCase().endsWith(".mp4") || originalFilename.toLowerCase().endsWith(".webm"))) {
            imageUrl = cloudinaryService.uploadVideo(file, "local-buddy/experiences/" + experienceId);
        } else {
            imageUrl = cloudinaryService.uploadImage(file, "local-buddy/experiences/" + experienceId);
        }
        saveImage(experience, imageUrl, displayOrder);
        return mapToDto(experience);
    }

    @Transactional
    public void deleteExperience(UUID currentUserId, UUID experienceId) {
        Experience experience = getExperienceEntity(experienceId);
        if (!experience.getTraveler().getId().equals(currentUserId)) {
            throw new IllegalArgumentException("You are not allowed to delete this experience.");
        }
        experienceRepository.delete(experience);
    }

    private void applyDto(Experience experience, ExperienceDto dto) {
        if (StringUtils.hasText(dto.getTitle())) {
            experience.setTitle(dto.getTitle().trim());
        }
        if (StringUtils.hasText(dto.getStoryContent())) {
            experience.setStoryContent(dto.getStoryContent().trim());
        }
        if (dto.getLocation() != null) {
            experience.setLocation(dto.getLocation());
        }
        if (dto.getRating() != null) {
            experience.setRating(dto.getRating());
        }
        if (dto.getTags() != null) {
            experience.setTags(new ArrayList<>(dto.getTags()));
        }
        if (dto.getPinned() != null) {
            experience.setIsPinned(dto.getPinned());
        }
    }

    private Specification<Experience> buildSearchSpecification(
            String searchQuery,
            List<String> tags,
            String duration,
            Short rating
    ) {
        return (root, query, cb) -> {
            Join<Experience, User> traveler = root.join("traveler");
            Join<Experience, User> buddy = root.join("buddy");
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.isTrue(traveler.get("isActive")));
            predicates.add(cb.isTrue(buddy.get("isActive")));
            predicates.add(cb.isNull(traveler.get("deletedAt")));
            predicates.add(cb.isNull(buddy.get("deletedAt")));

            if (StringUtils.hasText(searchQuery)) {
                String pattern = "%" + searchQuery.trim().toLowerCase() + "%";
                Expression<String> tagsText = cb.lower(cb.function("array_to_string", String.class, root.get("tags"), cb.literal(",")));
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("storyContent")), pattern),
                        cb.like(cb.lower(root.get("location")), pattern),
                        cb.like(cb.lower(traveler.get("fullName")), pattern),
                        cb.like(cb.lower(buddy.get("fullName")), pattern),
                        cb.like(tagsText, pattern)
                ));
            }

            List<String> normalizedTags = normalizeFilters(tags);
            if (!normalizedTags.isEmpty()) {
                Expression<String> tagsText = cb.lower(cb.function("array_to_string", String.class, root.get("tags"), cb.literal(",")));
                List<Predicate> tagPredicates = normalizedTags.stream()
                        .map(tag -> cb.like(tagsText, "%" + tag + "%"))
                        .toList();
                predicates.add(cb.or(tagPredicates.toArray(Predicate[]::new)));
            }

            if (rating != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("rating"), rating));
            }

            // The current Experience schema has no duration column; accept the parameter without in-memory filtering.
            if (StringUtils.hasText(duration)) {
                predicates.add(cb.conjunction());
            }

            query.orderBy(cb.desc(root.get("createdAt")));
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

    private void saveImage(Experience experience, String imageUrl) {
        saveImage(experience, imageUrl, null);
    }

    private void saveImage(Experience experience, String imageUrl, Integer requestedDisplayOrder) {
        if (!StringUtils.hasText(imageUrl)) {
            return;
        }

        ExperienceImage image = new ExperienceImage();
        image.setExperience(experience);
        image.setImageUrl(cloudinaryService.uploadBase64ImageIfNeeded(
                imageUrl.trim(),
                "local-buddy/experiences/" + experience.getId()
        ));
        int displayOrder = requestedDisplayOrder != null && requestedDisplayOrder >= 0
                ? requestedDisplayOrder
                : experienceImageRepository.findByExperienceIdOrderByDisplayOrderAscCreatedAtAsc(experience.getId()).size();
        image.setDisplayOrder(displayOrder);
        image.setCreatedAt(nowInExperienceZone());
        experienceImageRepository.save(image);
    }

    private ExperienceDto mapToDto(Experience experience) {
        List<String> images = experienceImageRepository.findByExperienceIdOrderByDisplayOrderAscCreatedAtAsc(experience.getId())
                .stream()
                .map(ExperienceImage::getImageUrl)
                .toList();
        String image = images.isEmpty() ? DEFAULT_IMAGE : images.get(0);
        OffsetDateTime createdAt = experience.getCreatedAt() != null
                ? experience.getCreatedAt().atZoneSameInstant(EXPERIENCE_ZONE).toOffsetDateTime()
                : null;

        return ExperienceDto.builder()
                .id(experience.getId())
                .travelerId(experience.getTraveler().getId())
                .travelerName(experience.getTraveler().getFullName())
                .travelerAvatar(AvatarService.getDisplayAvatarUrl(experience.getTraveler()))
                .buddyId(experience.getBuddy().getId())
                .buddyName(experience.getBuddy().getFullName())
                .bookingId(experience.getBooking() != null ? experience.getBooking().getId() : null)
                .title(experience.getTitle())
                .storyContent(experience.getStoryContent())
                .location(experience.getLocation())
                .rating(experience.getRating())
                .tags(experience.getTags() != null ? experience.getTags() : List.of())
                .pinned(Boolean.TRUE.equals(experience.getIsPinned()))
                .image(image)
                .images(images)
                .date(createdAt != null ? createdAt.format(DATE_FORMATTER) : "")
                .build();
    }

    private Experience getExperienceEntity(UUID experienceId) {
        return experienceRepository.findById(experienceId)
                .orElseThrow(() -> new IllegalArgumentException("Experience not found."));
    }

    private User getUser(UUID userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID is required.");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
    }

    private OffsetDateTime nowInExperienceZone() {
        return OffsetDateTime.now(EXPERIENCE_ZONE);
    }
}
