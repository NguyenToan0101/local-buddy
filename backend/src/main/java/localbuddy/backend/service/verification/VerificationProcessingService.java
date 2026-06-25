package localbuddy.backend.service.verification;

import localbuddy.backend.model.entity.BuddyProfile;
import localbuddy.backend.model.enums.VerificationStatus;
import localbuddy.backend.repository.BuddyProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationProcessingService {

    private static final String REQUIRED_MEDIA_MESSAGE =
            "Front ID, back ID, and selfie video are required before automatic verification.";
    private static final String QUEUED_MESSAGE =
            "Verification queued. Your profile will be automatically verified after 10 minutes.";
    private static final String APPROVED_MESSAGE =
            "Verification completed automatically after the 10-minute waiting period.";

    private final BuddyProfileRepository buddyProfileRepository;

    @Value("${buddy.verification.auto-approve-delay-minutes:10}")
    private long autoApproveDelayMinutes;

    public void processAsync(UUID userId) {
        CompletableFuture.delayedExecutor(autoApproveDelayMinutes, TimeUnit.MINUTES)
                .execute(() -> approveIfEligible(userId, true));
    }

    public String queuedMessage() {
        return QUEUED_MESSAGE;
    }

    @Transactional
    public BuddyProfile process(UUID userId) {
        return approveIfEligible(userId, false);
    }

    @Transactional
    @Scheduled(
            fixedDelayString = "${buddy.verification.auto-approve-scan-ms:60000}",
            initialDelayString = "${buddy.verification.auto-approve-scan-initial-delay-ms:60000}"
    )
    public void approveExpiredProcessingProfiles() {
        OffsetDateTime cutoff = OffsetDateTime.now().minusMinutes(autoApproveDelayMinutes);
        buddyProfileRepository.findByVerificationStatusAndUpdatedAtBefore(VerificationStatus.PROCESSING, cutoff)
                .forEach(profile -> {
                    if (hasRequiredVerificationMedia(profile)) {
                        autoApprove(profile);
                        buddyProfileRepository.save(profile);
                    } else {
                        markPending(profile);
                        buddyProfileRepository.save(profile);
                    }
                });
    }

    private BuddyProfile approveIfEligible(UUID userId, boolean requireDelayElapsed) {
        BuddyProfile profile = buddyProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Buddy profile not found for user: " + userId));

        if (profile.getVerificationStatus() != VerificationStatus.PROCESSING) {
            return profile;
        }

        if (requireDelayElapsed && !delayElapsed(profile)) {
            return profile;
        }

        if (!hasRequiredVerificationMedia(profile)) {
            markPending(profile);
            return buddyProfileRepository.save(profile);
        }

        autoApprove(profile);
        log.info("Auto verification completed for user {} after {} minutes.", userId, autoApproveDelayMinutes);
        return buddyProfileRepository.save(profile);
    }

    private boolean delayElapsed(BuddyProfile profile) {
        OffsetDateTime queuedAt = profile.getUpdatedAt();
        return queuedAt == null || !queuedAt.isAfter(OffsetDateTime.now().minusMinutes(autoApproveDelayMinutes));
    }

    private boolean hasRequiredVerificationMedia(BuddyProfile profile) {
        return StringUtils.hasText(profile.getIdCardFrontUrl())
                && StringUtils.hasText(profile.getIdCardBackUrl())
                && isVideoUrl(profile.getSelfieUrl());
    }

    private void autoApprove(BuddyProfile profile) {
        OffsetDateTime now = OffsetDateTime.now();
        profile.setVerificationStatus(VerificationStatus.VERIFIED);
        profile.setVerificationScore(100.0);
        profile.setRiskScore(0.0);
        profile.setRiskReason("Auto-approved by timed verification.");
        profile.setAutoVerificationMessage(APPROVED_MESSAGE);
        profile.setRejectionReason(null);
        profile.setDuplicateDetected(false);
        profile.setDuplicateUserId(null);
        profile.setVerifiedAt(now);
        profile.setProcessedAt(now);
        profile.setUpdatedAt(now);
    }

    private void markPending(BuddyProfile profile) {
        OffsetDateTime now = OffsetDateTime.now();
        profile.setVerificationStatus(VerificationStatus.PENDING);
        profile.setAutoVerificationMessage(REQUIRED_MEDIA_MESSAGE);
        profile.setProcessedAt(now);
        profile.setUpdatedAt(now);
    }

    private boolean isVideoUrl(String url) {
        if (!StringUtils.hasText(url)) {
            return false;
        }
        String normalized = url.toLowerCase();
        return normalized.contains("/video/upload/")
                || normalized.contains(".mp4")
                || normalized.contains(".webm");
    }
}
