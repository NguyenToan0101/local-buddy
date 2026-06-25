package localbuddy.backend.service;

import localbuddy.backend.dto.BuddyProfileDto;
import localbuddy.backend.model.entity.BuddyProfile;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.model.enums.UserRole;
import localbuddy.backend.model.enums.VerificationStatus;
import localbuddy.backend.repository.BuddyProfileRepository;
import localbuddy.backend.repository.UserRepository;
import localbuddy.backend.service.verification.VerificationProcessingService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BuddyProfileServiceTest {

    @Mock
    private BuddyProfileRepository buddyProfileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CloudinaryService cloudinaryService;

    @Mock
    private VerificationProcessingService verificationProcessingService;

    @InjectMocks
    private BuddyProfileService buddyProfileService;

    @Test
    void uploadIdCardOnlyStoresMediaAndDoesNotStartVerification() {
        UUID userId = UUID.randomUUID();
        BuddyProfile profile = profile(user(userId), VerificationStatus.PENDING);
        MockMultipartFile file = new MockMultipartFile("file", "front.jpg", "image/jpeg", new byte[] {1});

        when(buddyProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(cloudinaryService.uploadImage(file, "local-buddy/users/" + userId + "/verification"))
                .thenReturn("https://cdn.example/front.jpg");
        when(buddyProfileRepository.save(any(BuddyProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BuddyProfileDto result = buddyProfileService.updateIdCard(userId, "front", file, userId, false);

        assertThat(result.getVerificationStatus()).isEqualTo("pending");
        assertThat(result.getAutoVerificationMessage()).contains("automatic verification can start");
        assertThat(result.getIdCardFront()).isEqualTo("https://cdn.example/front.jpg");
        verify(verificationProcessingService, never()).processAsync(any(UUID.class));
    }

    @Test
    void updateProfileQueuesTimedVerificationWhenRequiredMediaIsPending() {
        UUID userId = UUID.randomUUID();
        User user = user(userId);
        BuddyProfile profile = profile(user, VerificationStatus.PENDING);
        profile.setIdCardFrontUrl("https://cdn.example/front.jpg");
        profile.setIdCardBackUrl("https://cdn.example/back.jpg");
        profile.setSelfieUrl("https://cdn.example/selfie.mp4");

        BuddyProfileDto dto = BuddyProfileDto.builder()
                .name("Updated Buddy")
                .location("Da Nang, Vietnam")
                .build();

        when(buddyProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(userRepository.save(user)).thenReturn(user);
        when(verificationProcessingService.queuedMessage())
                .thenReturn("Verification queued. Your profile will be automatically verified after 10 minutes.");
        when(buddyProfileRepository.save(any(BuddyProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BuddyProfileDto result = buddyProfileService.updateProfile(userId, dto, userId, false);

        assertThat(result.getVerificationStatus()).isEqualTo("processing");
        assertThat(result.getAutoVerificationMessage()).contains("10 minutes");
        verify(verificationProcessingService).processAsync(userId);
    }

    @Test
    void updateProfileDoesNotRestartVerificationWhenAlreadyProcessing() {
        UUID userId = UUID.randomUUID();
        User user = user(userId);
        BuddyProfile profile = profile(user, VerificationStatus.PROCESSING);
        profile.setIdCardFrontUrl("https://cdn.example/front.jpg");
        profile.setIdCardBackUrl("https://cdn.example/back.jpg");
        profile.setSelfieUrl("https://cdn.example/selfie.mp4");

        BuddyProfileDto dto = BuddyProfileDto.builder()
                .description("Updated bio")
                .build();

        when(buddyProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(userRepository.save(user)).thenReturn(user);
        when(buddyProfileRepository.save(any(BuddyProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BuddyProfileDto result = buddyProfileService.updateProfile(userId, dto, userId, false);

        assertThat(result.getVerificationStatus()).isEqualTo("processing");
        verify(verificationProcessingService, never()).processAsync(any(UUID.class));
    }

    @Test
    void updateProfileRejectsInvalidAgeBeforeDatabaseConstraint() {
        UUID userId = UUID.randomUUID();
        User user = user(userId);
        BuddyProfile profile = profile(user, VerificationStatus.PENDING);
        BuddyProfileDto dto = BuddyProfileDto.builder()
                .age(3)
                .build();

        when(buddyProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(userRepository.save(user)).thenReturn(user);

        assertThatThrownBy(() -> buddyProfileService.updateProfile(userId, dto, userId, false))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Buddy age must be between 18 and 100.");

        verify(buddyProfileRepository, never()).save(any(BuddyProfile.class));
    }

    @Test
    void updateProfileRejectsInvalidHourlyRateBeforeDatabaseConstraint() {
        UUID userId = UUID.randomUUID();
        User user = user(userId);
        BuddyProfile profile = profile(user, VerificationStatus.PENDING);
        BuddyProfileDto dto = BuddyProfileDto.builder()
                .price(BigDecimal.valueOf(2))
                .build();

        when(buddyProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(userRepository.save(user)).thenReturn(user);

        assertThatThrownBy(() -> buddyProfileService.updateProfile(userId, dto, userId, false))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Hourly rate must be between $5 and $500.");

        verify(buddyProfileRepository, never()).save(any(BuddyProfile.class));
    }

    private User user(UUID id) {
        User user = new User();
        user.setId(id);
        user.setEmail("buddy@example.com");
        user.setPasswordHash("password");
        user.setFullName("Buddy User");
        user.setRole(UserRole.BUDDY);
        user.setIsBuddy(true);
        user.setIsActive(true);
        user.setCreatedAt(OffsetDateTime.parse("2026-06-24T10:00:00+07:00"));
        user.setUpdatedAt(OffsetDateTime.parse("2026-06-24T10:00:00+07:00"));
        return user;
    }

    private BuddyProfile profile(User user, VerificationStatus status) {
        BuddyProfile profile = new BuddyProfile();
        profile.setId(UUID.randomUUID());
        profile.setUser(user);
        profile.setAge((short) 25);
        profile.setLocation("Hanoi, Vietnam");
        profile.setHourlyRate(BigDecimal.valueOf(15));
        profile.setRating(BigDecimal.valueOf(5.0));
        profile.setReviewCount(0);
        profile.setVerificationStatus(status);
        profile.setCreatedAt(OffsetDateTime.parse("2026-06-24T10:00:00+07:00"));
        profile.setUpdatedAt(OffsetDateTime.parse("2026-06-24T10:00:00+07:00"));
        return profile;
    }
}
