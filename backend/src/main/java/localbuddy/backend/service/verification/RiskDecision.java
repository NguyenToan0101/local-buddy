package localbuddy.backend.service.verification;

import localbuddy.backend.model.enums.VerificationStatus;

public record RiskDecision(VerificationStatus status, double riskScore, String reason) {
}
