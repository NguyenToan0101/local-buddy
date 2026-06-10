package localbuddy.backend.service.verification;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@Profile("!mock-ai")
@RequiredArgsConstructor
public class RealLivenessDetectionService implements LivenessDetectionService {

    private final AiVerificationClient aiVerificationClient;

    @Override
    public LivenessResult analyze(String selfieOrVideoUrl) {
        if (!StringUtils.hasText(selfieOrVideoUrl)) {
            return new LivenessResult(false, 0.0, "");
        }
        AiVerificationClient.AiLivenessResponse response = aiVerificationClient.liveness(selfieOrVideoUrl);
        if (response == null || response.livenessScore() == null) {
            throw new IllegalStateException("AI liveness service returned no result.");
        }
        return new LivenessResult(
                Boolean.TRUE.equals(response.livenessPassed()),
                response.livenessScore(),
                response.details() != null ? String.valueOf(response.details()) : ""
        );
    }
}
