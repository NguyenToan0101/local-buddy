package localbuddy.backend.service.verification;

import localbuddy.backend.model.enums.VerificationStatus;

public record VerificationDecision(
        VerificationStatus status,
        double score,
        String message,
        String rejectionReason
) {
}
