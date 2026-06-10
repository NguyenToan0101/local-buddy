package localbuddy.backend.service.verification;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("mock-ai")
public class MockAntiSpoofingService implements AntiSpoofingService {
    @Override
    public AntiSpoofResult check(String mediaUrl) {
        return new AntiSpoofResult(false, 12.0, "{mock=true}");
    }
}
