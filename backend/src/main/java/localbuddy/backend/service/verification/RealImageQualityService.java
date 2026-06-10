package localbuddy.backend.service.verification;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("!mock-ai")
@RequiredArgsConstructor
public class RealImageQualityService implements ImageQualityService {

    private final AiVerificationClient aiVerificationClient;

    @Override
    public QualityResult check(String imageUrl) {
        AiVerificationClient.AiQualityResponse response = aiVerificationClient.quality(imageUrl);
        if (response == null || response.qualityScore() == null) {
            throw new IllegalStateException("AI quality service returned no result.");
        }
        return new QualityResult(
                Boolean.TRUE.equals(response.qualityPassed()),
                response.qualityScore(),
                String.valueOf(response.details())
        );
    }
}
