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

        boolean frontCardPresent = StringUtils.hasText(profile.getIdCardFrontUrl());
        boolean backCardPresent = StringUtils.hasText(profile.getIdCardBackUrl());
        boolean selfiePresent = StringUtils.hasText(profile.getSelfieUrl());

        if (!frontCardPresent && !backCardPresent && !selfiePresent) {
            profile.setVerificationStatus(VerificationStatus.PENDING);
            profile.setAutoVerificationMessage("Front ID, back ID, and liveness video are required before auto verification.");
            profile.setProcessedAt(OffsetDateTime.now());
            return buddyProfileRepository.save(profile);
        }

        try {
            // 1. Front ID Card checks: OCR and Image Quality Check
            if (frontCardPresent) {
                try {
                    OcrResult ocrResult = ocrService.extractInfo(profile.getIdCardFrontUrl());
                    profile.setExtractedFullName(ocrResult.fullName());
                    profile.setExtractedIdNumber(ocrResult.idNumber());
                    profile.setExtractedDateOfBirth(ocrResult.dateOfBirth());
                    profile.setOcrRawText(ocrResult.rawText());
                    profile.setOcrScore(ocrResult.ocrScore());
                } catch (Exception e) {
                    log.warn("OCR check failed for user {}: {}", userId, e.getMessage());
                }

                try {
                    QualityResult qualityResult = imageQualityService.check(profile.getIdCardFrontUrl());
                    profile.setQualityScore(qualityResult.score());
                    profile.setQualityDetails(qualityResult.details());
                } catch (Exception e) {
                    log.warn("Quality check failed for user {}: {}", userId, e.getMessage());
                }
            }

            // 2. Selfie Video checks: Liveness detection and Anti-spoofing
            if (selfiePresent) {
                try {
                    LivenessResult livenessResult = livenessDetectionService.analyze(profile.getSelfieUrl());
                    profile.setLivenessScore(livenessResult.score());
                    profile.setLivenessDetails(livenessResult.details());
                } catch (Exception e) {
                    log.warn("Liveness detection failed for user {}: {}", userId, e.getMessage());
                }

                try {
                    AntiSpoofResult antiSpoofResult = antiSpoofingService.check(profile.getSelfieUrl());
                    profile.setAntiSpoofScore(antiSpoofResult.spoofScore());
                    profile.setAntiSpoofDetails(antiSpoofResult.details());
                } catch (Exception e) {
                    log.warn("Anti-spoof check failed for user {}: {}", userId, e.getMessage());
                }
            }

            // 3. Face matching: Card vs Selfie
            if (frontCardPresent && selfiePresent) {
                try {
                    double faceMatchScore = faceMatchingService.compare(profile.getIdCardFrontUrl(), profile.getSelfieUrl());
                    profile.setFaceMatchScore(faceMatchScore);
                } catch (Exception e) {
                    log.warn("Face matching failed for user {}: {}", userId, e.getMessage());
                }
            }

            // 4. Duplicate identity check
            DuplicateResult duplicateResult = null;
            if (StringUtils.hasText(profile.getExtractedIdNumber())) {
                try {
                    duplicateResult = duplicateIdentityService.check(userId, profile.getExtractedIdNumber());
                    profile.setDuplicateDetected(duplicateResult.duplicateDetected());
                    profile.setDuplicateUserId(duplicateResult.duplicateUserId());
                } catch (Exception e) {
                    log.warn("Duplicate identity check failed for user {}: {}", userId, e.getMessage());
                }
            }

            // 5. Overall Risk Scoring (only if all 3 files are present)
            if (frontCardPresent && backCardPresent && selfiePresent) {
                profile.setVerificationStatus(VerificationStatus.PROCESSING);

                OcrResult ocrResult = new OcrResult(
                        true,
                        profile.getExtractedFullName(),
                        profile.getExtractedIdNumber(),
                        profile.getExtractedDateOfBirth(),
                        "Success",
                        profile.getOcrScore() != null ? profile.getOcrScore() : 0.0,
                        profile.getOcrRawText()
                );

                QualityResult qualityResult = new QualityResult(
                        profile.getQualityScore() != null && profile.getQualityScore() >= 70.0,
                        profile.getQualityScore() != null ? profile.getQualityScore() : 0.0,
                        profile.getQualityDetails()
                );

                AntiSpoofResult antiSpoofResult = new AntiSpoofResult(
                        profile.getAntiSpoofScore() != null && profile.getAntiSpoofScore() >= 65.0,
                        profile.getAntiSpoofScore() != null ? profile.getAntiSpoofScore() : 0.0,
                        profile.getAntiSpoofDetails()
                );

                RiskDecision decision = riskScoringService.decide(
                        ocrResult,
                        profile.getFaceMatchScore() != null ? profile.getFaceMatchScore() : 0.0,
                        profile.getLivenessScore() != null ? profile.getLivenessScore() : 0.0,
                        qualityResult,
                        antiSpoofResult,
                        duplicateResult
                );

                profile.setRiskScore(decision.riskScore());
                profile.setRiskReason(decision.reason());
                profile.setVerificationScore(decision.riskScore());
                profile.setVerificationStatus(decision.status());
                profile.setAutoVerificationMessage(decision.reason());
                profile.setRejectionReason(decision.status() == VerificationStatus.AUTO_REJECTED ? decision.reason() : null);

                if (decision.status() == VerificationStatus.AUTO_APPROVED) {
                    profile.setVerifiedAt(OffsetDateTime.now());
                }
                log.info("Auto verification completed for user {} with status {} and score {}",
                        userId, decision.status(), decision.riskScore());
            } else {
                profile.setVerificationStatus(VerificationStatus.PENDING);
                profile.setAutoVerificationMessage("Front ID, back ID, and liveness video are required before auto verification decision can be completed.");
            }

            profile.setProcessedAt(OffsetDateTime.now());
            profile.setUpdatedAt(OffsetDateTime.now());
            return buddyProfileRepository.save(profile);
        } catch (Exception e) {
            log.warn("Auto verification failed for user {}. Sending to manual review: {}", userId, e.getMessage());
            profile.setVerificationStatus(VerificationStatus.MANUAL_REVIEW);
            profile.setAutoVerificationMessage("Auto verification failed: " + e.getMessage());
            profile.setProcessedAt(OffsetDateTime.now());
            profile.setUpdatedAt(OffsetDateTime.now());
            return buddyProfileRepository.save(profile);
        }
    }
}
