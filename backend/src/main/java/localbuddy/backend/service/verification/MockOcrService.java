package localbuddy.backend.service.verification;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.context.annotation.Profile;

@Service
@Profile("mock-ai")
public class MockOcrService implements OcrService {

    @Override
    public OcrResult extractInfo(String imageUrl) {
        if (!StringUtils.hasText(imageUrl)) {
            return new OcrResult(false, null, null, null, "No ID card image available for OCR.", 0.0, "");
        }
        return new OcrResult(true, "Mock Extracted Name", "012345678901", "1995-01-01", "Mock OCR completed.", 90.0, "Mock raw OCR text");
    }
}
