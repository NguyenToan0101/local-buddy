package localbuddy.backend.service.verification;

import localbuddy.backend.model.entity.BuddyProfile;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.model.enums.VerificationStatus;
import localbuddy.backend.repository.BuddyProfileRepository;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class VerificationProcessingServiceTest {

    private final BuddyProfileRepository buddyProfileRepository = mock(BuddyProfileRepository.class);
    private final VerificationProcessingService verificationProcessingService =
            new VerificationProcessingService(buddyProfileRepository);

    @Test
    void processVerifiesProcessingProfileWithRequiredMedia() {
        UUID userId = UUID.randomUUID();
        BuddyProfile profile = processingProfile(userId);

        when(buddyProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(buddyProfileRepository.save(any(BuddyProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BuddyProfile result = verificationProcessingService.process(userId);

        assertThat(result.getVerificationStatus()).isEqualTo(VerificationStatus.VERIFIED);
        assertThat(result.getVerificationScore()).isEqualTo(100.0);
        assertThat(result.getRiskScore()).isEqualTo(0.0);
        assertThat(result.getVerifiedAt()).isNotNull();
        assertThat(result.getAutoVerificationMessage()).contains("10-minute waiting period");
    }

    @Test
    void processReturnsPendingWhenRequiredMediaIsMissing() {
        UUID userId = UUID.randomUUID();
        BuddyProfile profile = processingProfile(userId);
        profile.setSelfieUrl(null);

        when(buddyProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(buddyProfileRepository.save(any(BuddyProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BuddyProfile result = verificationProcessingService.process(userId);

        assertThat(result.getVerificationStatus()).isEqualTo(VerificationStatus.PENDING);
        assertThat(result.getAutoVerificationMessage()).contains("required before automatic verification");
    }

    private BuddyProfile processingProfile(UUID userId) {
        User user = new User();
        user.setId(userId);

        BuddyProfile profile = new BuddyProfile();
        profile.setId(UUID.randomUUID());
        profile.setUser(user);
        profile.setVerificationStatus(VerificationStatus.PROCESSING);
        profile.setIdCardFrontUrl("https://cdn.example/front.jpg");
        profile.setIdCardBackUrl("https://cdn.example/back.jpg");
        profile.setSelfieUrl("https://cdn.example/video/upload/selfie.webm");
        profile.setUpdatedAt(OffsetDateTime.now().minusMinutes(10));
        return profile;
    }
}
