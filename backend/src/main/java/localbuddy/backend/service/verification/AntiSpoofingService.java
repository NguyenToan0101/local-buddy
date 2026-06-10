package localbuddy.backend.service.verification;

public interface AntiSpoofingService {
    AntiSpoofResult check(String mediaUrl);
}
