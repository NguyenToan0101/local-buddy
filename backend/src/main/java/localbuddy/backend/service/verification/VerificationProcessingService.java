package localbuddy.backend.service.verification;

import localbuddy.backend.model.entity.BuddyProfile;
import localbuddy.backend.model.enums.VerificationStatus;
import localbuddy.backend.repository.BuddyProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.OffsetDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationProcessingService {

    private final BuddyProfileRepository buddyProfileRepository;
    private final OcrService ocrService;
    private final FaceMatchingService faceMatchingService;
    private final LivenessDetectionService livenessDetectionService;
    private final ImageQualityService imageQualityService;
    private final AntiSpoofingService antiSpoofingService;
    private final DuplicateIdentityService duplicateIdentityService;
    private final RiskScoringService riskScoringService;

    @Async
    public void processAsync(UUID userId) {
        process(userId);
    }

    @Transactional
    public BuddyProfile process(UUID userId) {
        BuddyProfile profile = buddyProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Buddy profile not found for user: " + userId));

        if (!StringUtils.hasText(profile.getIdCardFrontUrl())
                || !StringUtils.hasText(profile.getIdCardBackUrl())
                || !StringUtils.hasText(profile.getSelfieUrl())) {
            profile.setVerificationStatus(VerificationStatus.PENDING);
            profile.setAutoVerificationMessage("Front ID, back ID, and liveness video are required before auto verification.");
            profile.setProcessedAt(OffsetDateTime.now());
            return buddyProfileRepository.save(profile);
        }

        profile.setVerificationStatus(VerificationStatus.PROCESSING);
        profile.setUpdatedAt(OffsetDateTime.now());
        buddyProfileRepository.save(profile);

        try {
            String livenessMediaUrl = profile.getSelfieUrl();

            OcrResult ocrResult = ocrService.extractInfo(profile.getIdCardFrontUrl());
            double faceMatchScore = faceMatchingService.compare(profile.getIdCardFrontUrl(), livenessMediaUrl);
            LivenessResult livenessResult = livenessDetectionService.analyze(livenessMediaUrl);
            double livenessScore = livenessResult.score();
            QualityResult qualityResult = imageQualityService.check(profile.getIdCardFrontUrl());
            AntiSpoofResult antiSpoofResult = antiSpoofingService.check(livenessMediaUrl);
            DuplicateResult duplicateResult = duplicateIdentityService.check(userId, ocrResult.idNumber());
            RiskDecision decision = riskScoringService.decide(
                    ocrResult,
                    faceMatchScore,
                    livenessScore,
                    qualityResult,
                    antiSpoofResult,
                    duplicateResult
            );

            profile.setExtractedFullName(ocrResult.fullName());
            profile.setExtractedIdNumber(ocrResult.idNumber());
            profile.setExtractedDateOfBirth(ocrResult.dateOfBirth());
            profile.setOcrRawText(ocrResult.rawText());
            profile.setOcrScore(ocrResult.ocrScore());
            profile.setFaceMatchScore(faceMatchScore);
            profile.setLivenessScore(livenessScore);
            profile.setLivenessDetails(livenessResult.details());
            profile.setQualityScore(qualityResult.score());
            profile.setQualityDetails(qualityResult.details());
            profile.setAntiSpoofScore(antiSpoofResult.spoofScore());
            profile.setAntiSpoofDetails(antiSpoofResult.details());
            profile.setDuplicateDetected(duplicateResult.duplicateDetected());
            profile.setDuplicateUserId(duplicateResult.duplicateUserId());
            profile.setRiskScore(decision.riskScore());
            profile.setRiskReason(decision.reason());
            profile.setVerificationScore(decision.riskScore());
            profile.setVerificationStatus(decision.status());
            profile.setAutoVerificationMessage(decision.reason());
            profile.setRejectionReason(decision.status() == VerificationStatus.AUTO_REJECTED ? decision.reason() : null);
            profile.setProcessedAt(OffsetDateTime.now());
            profile.setUpdatedAt(OffsetDateTime.now());

            if (decision.status() == VerificationStatus.AUTO_APPROVED) {
                profile.setVerifiedAt(OffsetDateTime.now());
            }

            log.info("Auto verification completed for user {} with status {} and score {}",
                    userId, decision.status(), decision.riskScore());
            return buddyProfileRepository.save(profile);
        } catch (RuntimeException e) {
            log.warn("Auto verification failed for user {}. Sending to manual review: {}", userId, e.getMessage());
            profile.setVerificationStatus(VerificationStatus.MANUAL_REVIEW);
            profile.setAutoVerificationMessage("Auto verification failed: " + e.getMessage());
            profile.setProcessedAt(OffsetDateTime.now());
            profile.setUpdatedAt(OffsetDateTime.now());
            return buddyProfileRepository.save(profile);
        }
    }
}
