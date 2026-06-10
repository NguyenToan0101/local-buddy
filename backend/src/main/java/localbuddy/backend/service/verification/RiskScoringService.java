package localbuddy.backend.service.verification;

import localbuddy.backend.model.enums.VerificationStatus;
import org.springframework.stereotype.Service;

@Service
public class RiskScoringService {

    public RiskDecision decide(
            OcrResult ocr,
            double faceScore,
            double livenessScore,
            QualityResult quality,
            AntiSpoofResult antiSpoof,
            DuplicateResult duplicate
    ) {
        double ocrScore = ocr != null ? ocr.ocrScore() : 0.0;
        double qualityScore = quality != null ? quality.score() : 0.0;
        double antiSpoofSafeScore = antiSpoof != null ? Math.max(0.0, 100.0 - antiSpoof.spoofScore()) : 0.0;
        double finalScore = ocrScore * 0.20
                + faceScore * 0.25
                + livenessScore * 0.20
                + qualityScore * 0.15
                + antiSpoofSafeScore * 0.20;

        if (duplicate != null && duplicate.duplicateDetected()) {
            return new RiskDecision(VerificationStatus.MANUAL_REVIEW, finalScore, duplicate.reason());
        }
        if (antiSpoof != null && antiSpoof.spoofScore() >= 65.0) {
            return new RiskDecision(VerificationStatus.MANUAL_REVIEW, finalScore, "High anti-spoof risk.");
        }
        if (quality != null && !quality.passed()) {
            return new RiskDecision(VerificationStatus.MANUAL_REVIEW, finalScore, "Document image quality is not sufficient.");
        }
        if (faceScore <= 0.0) {
            return new RiskDecision(VerificationStatus.MANUAL_REVIEW, finalScore, "Face could not be matched or detected.");
        }
        if (finalScore >= 85.0) {
            return new RiskDecision(VerificationStatus.AUTO_APPROVED, finalScore, "Low risk auto approval.");
        }
        if (finalScore >= 60.0) {
            return new RiskDecision(VerificationStatus.MANUAL_REVIEW, finalScore, "Medium risk manual review required.");
        }
        return new RiskDecision(VerificationStatus.AUTO_REJECTED, finalScore, "High risk verification rejected.");
    }
}
