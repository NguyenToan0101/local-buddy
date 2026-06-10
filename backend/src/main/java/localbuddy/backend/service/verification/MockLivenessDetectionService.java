package localbuddy.backend.service.verification;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.context.annotation.Profile;

@Service
@Profile("mock-ai")
public class MockLivenessDetectionService implements LivenessDetectionService {

    @Override
    public LivenessResult analyze(String selfieOrVideoUrl) {
        if (!StringUtils.hasText(selfieOrVideoUrl)) {
            return new LivenessResult(false, 0.0, "");
        }
        return new LivenessResult(true, 88.0, "{mock=true}");
    }
}
