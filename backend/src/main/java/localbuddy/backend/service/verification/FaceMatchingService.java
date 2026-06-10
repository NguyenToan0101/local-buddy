package localbuddy.backend.service.verification;

public interface FaceMatchingService {
    double compare(String idCardImageUrl, String selfieImageUrl);
}
