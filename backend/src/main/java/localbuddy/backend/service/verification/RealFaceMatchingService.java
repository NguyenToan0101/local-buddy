package localbuddy.backend.service.verification;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@Profile("!mock-ai")
@RequiredArgsConstructor
public class RealFaceMatchingService implements FaceMatchingService {

    private final AiVerificationClient aiVerificationClient;

    @Override
    public double compare(String idCardImageUrl, String selfieImageUrl) {
        if (!StringUtils.hasText(idCardImageUrl) || !StringUtils.hasText(selfieImageUrl)) {
            return 0.0;
        }

        AiVerificationClient.AiFaceMatchResponse response = aiVerificationClient.faceMatch(idCardImageUrl, selfieImageUrl);
        if (response == null || !Boolean.TRUE.equals(response.success())) {
            String message = response != null ? response.message() : "No response from AI face matching service.";
            throw new IllegalStateException(message);
        }
        return response.score() != null ? response.score() : 0.0;
    }
}
