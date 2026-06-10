package localbuddy.backend.service.verification;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("mock-ai")
public class MockImageQualityService implements ImageQualityService {
    @Override
    public QualityResult check(String imageUrl) {
        return new QualityResult(true, 92.0, "{mock=true}");
    }
}
