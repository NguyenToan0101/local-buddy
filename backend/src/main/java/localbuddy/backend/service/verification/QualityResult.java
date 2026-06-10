package localbuddy.backend.service.verification;

public record QualityResult(boolean passed, double score, String details) {
}
