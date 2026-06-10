package localbuddy.backend.service;

import localbuddy.backend.model.entity.BuddyProfile;
import localbuddy.backend.model.entity.ExperienceImage;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.repository.BuddyProfileRepository;
import localbuddy.backend.repository.ExperienceImageRepository;
import localbuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class Base64ImageMigrationJob implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BuddyProfileRepository buddyProfileRepository;
    private final ExperienceImageRepository experienceImageRepository;
    private final CloudinaryService cloudinaryService;

    @Value("${app.cloudinary.migrate-base64:false}")
    private boolean migrateBase64;

    @Override
    @Transactional
    public void run(String... args) {
        if (!migrateBase64) {
            return;
        }

        MigrationStats stats = new MigrationStats();
        migrateUserAvatars(stats);
        migrateBuddyIdCards(stats);
        migrateExperienceImages(stats);
        log.info("Base64 image migration finished. success={}, failed={}, skipped={}",
                stats.success, stats.failed, stats.skipped);
    }

    private void migrateUserAvatars(MigrationStats stats) {
        for (User user : userRepository.findAll()) {
            String value = user.getAvatarUrl();
            if (!CloudinaryService.isBase64DataUri(value)) {
                stats.skipped++;
                continue;
            }
            try {
                String url = cloudinaryService.uploadBase64Image(value, "local-buddy/users/" + user.getId() + "/avatar");
                user.setAvatarUrl(url);
                userRepository.save(user);
                stats.success++;
            } catch (RuntimeException e) {
                stats.failed++;
                log.warn("Failed to migrate avatar for user {}: {}", user.getId(), e.getMessage());
            }
        }
    }

    private void migrateBuddyIdCards(MigrationStats stats) {
        for (BuddyProfile profile : buddyProfileRepository.findAll()) {
            if (CloudinaryService.isBase64DataUri(profile.getIdCardFrontUrl())) {
                try {
                    String url = cloudinaryService.uploadBase64Image(
                            profile.getIdCardFrontUrl(),
                            "local-buddy/users/" + profile.getUser().getId() + "/verification"
                    );
                    profile.setIdCardFrontUrl(url);
                    stats.success++;
                } catch (RuntimeException e) {
                    stats.failed++;
                    log.warn("Failed to migrate front ID for buddy {}: {}", profile.getUser().getId(), e.getMessage());
                }
            } else {
                stats.skipped++;
            }

            if (CloudinaryService.isBase64DataUri(profile.getIdCardBackUrl())) {
                try {
                    String url = cloudinaryService.uploadBase64Image(
                            profile.getIdCardBackUrl(),
                            "local-buddy/users/" + profile.getUser().getId() + "/verification"
                    );
                    profile.setIdCardBackUrl(url);
                    stats.success++;
                } catch (RuntimeException e) {
                    stats.failed++;
                    log.warn("Failed to migrate back ID for buddy {}: {}", profile.getUser().getId(), e.getMessage());
                }
            } else {
                stats.skipped++;
            }
            buddyProfileRepository.save(profile);
        }
    }

    private void migrateExperienceImages(MigrationStats stats) {
        for (ExperienceImage image : experienceImageRepository.findAll()) {
            String value = image.getImageUrl();
            if (!CloudinaryService.isBase64DataUri(value)) {
                stats.skipped++;
                continue;
            }
            try {
                String url = cloudinaryService.uploadBase64Image(
                        value,
                        "local-buddy/experiences/" + image.getExperience().getId()
                );
                image.setImageUrl(url);
                experienceImageRepository.save(image);
                stats.success++;
            } catch (RuntimeException e) {
                stats.failed++;
                log.warn("Failed to migrate experience image {}: {}", image.getId(), e.getMessage());
            }
        }
    }

    private static class MigrationStats {
        private int success;
        private int failed;
        private int skipped;
    }
}
