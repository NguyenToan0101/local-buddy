package localbuddy.backend.service.verification;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.context.annotation.Profile;

@Service
@Profile("mock-ai")
public class MockFaceMatchingService implements FaceMatchingService {

    @Override
    public double compare(String idCardImageUrl, String selfieImageUrl) {
        if (!StringUtils.hasText(idCardImageUrl) || !StringUtils.hasText(selfieImageUrl)) {
            return 0.0;
        }
        return 86.0;
    }
}
