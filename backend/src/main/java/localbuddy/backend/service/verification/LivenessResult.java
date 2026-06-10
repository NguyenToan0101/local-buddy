package localbuddy.backend.service.verification;

public record LivenessResult(
        boolean passed,
        double score,
        String details
) {
}
