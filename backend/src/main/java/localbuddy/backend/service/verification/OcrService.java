package localbuddy.backend.service.verification;

public interface OcrService {
    OcrResult extractInfo(String imageUrl);
}
