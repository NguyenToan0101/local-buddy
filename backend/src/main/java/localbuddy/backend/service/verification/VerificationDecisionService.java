package localbuddy.backend.service.verification;

import localbuddy.backend.model.enums.VerificationStatus;
import org.springframework.stereotype.Service;

@Service
public class VerificationDecisionService {

    public VerificationDecision decide(OcrResult ocrResult, double faceMatchScore, double livenessScore) {
        double score = 0.0;
        if (ocrResult != null && ocrResult.valid()) {
            score += 30.0;
        }
        score += Math.max(0.0, Math.min(faceMatchScore, 100.0)) * 0.35;
        score += Math.max(0.0, Math.min(livenessScore, 100.0)) * 0.35;

        if (score >= 80.0) {
            return new VerificationDecision(
                    VerificationStatus.AUTO_APPROVED,
                    score,
                    "Auto verification approved with high confidence.",
                    null
            );
        }
        if (score >= 50.0) {
            return new VerificationDecision(
                    VerificationStatus.MANUAL_REVIEW,
                    score,
                    "Auto verification requires manual review.",
                    null
            );
        }
        return new VerificationDecision(
                VerificationStatus.AUTO_REJECTED,
                score,
                "Auto verification rejected due to low confidence.",
                "Verification confidence is below the minimum threshold."
        );
    }
}
