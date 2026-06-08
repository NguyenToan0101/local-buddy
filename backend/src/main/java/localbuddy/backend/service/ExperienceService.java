package localbuddy.backend.service;

import localbuddy.backend.dto.ExperienceDto;
import localbuddy.backend.model.entity.Experience;
import localbuddy.backend.model.entity.ExperienceImage;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.repository.ExperienceImageRepository;
import localbuddy.backend.repository.ExperienceRepository;
import localbuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

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

    @Transactional
    public ExperienceDto createExperience(UUID currentUserId, ExperienceDto dto) {
        User traveler = getUser(currentUserId);
        User buddy = getUser(dto.getBuddyId());

        Experience experience = new Experience();
        experience.setTraveler(traveler);
        experience.setBuddy(buddy);
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

    private void saveImage(Experience experience, String imageUrl) {
        if (!StringUtils.hasText(imageUrl)) {
            return;
        }

        ExperienceImage image = new ExperienceImage();
        image.setExperience(experience);
        image.setImageUrl(imageUrl.trim());
        image.setDisplayOrder(0);
        image.setCreatedAt(nowInExperienceZone());
        experienceImageRepository.save(image);
    }

    private ExperienceDto mapToDto(Experience experience) {
        String image = experienceImageRepository.findFirstByExperienceIdOrderByDisplayOrderAscCreatedAtAsc(experience.getId())
                .map(ExperienceImage::getImageUrl)
                .orElse(DEFAULT_IMAGE);
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
                .title(experience.getTitle())
                .storyContent(experience.getStoryContent())
                .location(experience.getLocation())
                .rating(experience.getRating())
                .tags(experience.getTags() != null ? experience.getTags() : List.of())
                .pinned(Boolean.TRUE.equals(experience.getIsPinned()))
                .image(image)
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
