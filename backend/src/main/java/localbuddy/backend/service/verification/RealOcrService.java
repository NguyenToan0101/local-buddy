package localbuddy.backend.service.verification;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@Profile("!mock-ai")
@RequiredArgsConstructor
public class RealOcrService implements OcrService {

    private final AiVerificationClient aiVerificationClient;

    @Override
    public OcrResult extractInfo(String imageUrl) {
        if (!StringUtils.hasText(imageUrl)) {
            return new OcrResult(false, null, null, null, "No ID card image available for OCR.", 0.0, "");
        }

        AiVerificationClient.AiOcrResponse response = aiVerificationClient.ocr(imageUrl);
        if (response == null || !Boolean.TRUE.equals(response.success())) {
            throw new IllegalStateException("AI OCR service failed or returned no text.");
        }

        return new OcrResult(
                true,
                response.fullName(),
                response.idNumber(),
                response.dateOfBirth(),
                response.message() != null ? response.message() : "OCR completed by AI service.",
                response.ocrScore() != null ? response.ocrScore() : 0.0,
                response.rawText()
        );
    }
}
