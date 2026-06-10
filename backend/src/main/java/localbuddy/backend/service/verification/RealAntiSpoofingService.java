package localbuddy.backend.service.verification;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@Profile("!mock-ai")
@RequiredArgsConstructor
public class RealAntiSpoofingService implements AntiSpoofingService {

    private final AiVerificationClient aiVerificationClient;

    @Override
    public AntiSpoofResult check(String mediaUrl) {
        if (!StringUtils.hasText(mediaUrl)) {
            return new AntiSpoofResult(true, 100.0, "No selfie/video media for anti-spoofing.");
        }
        AiVerificationClient.AiAntiSpoofResponse response = aiVerificationClient.antiSpoof(mediaUrl);
        if (response == null || response.spoofScore() == null) {
            throw new IllegalStateException("AI anti-spoofing service returned no result.");
        }
        return new AntiSpoofResult(
                Boolean.TRUE.equals(response.isSpoof()),
                response.spoofScore(),
                String.valueOf(response.details())
        );
    }
}
