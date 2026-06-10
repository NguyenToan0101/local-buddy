package localbuddy.backend.service.verification;

public record AntiSpoofResult(boolean spoof, double spoofScore, String details) {
}
