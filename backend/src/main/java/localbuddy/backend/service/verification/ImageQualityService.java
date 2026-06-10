package localbuddy.backend.service.verification;

public interface ImageQualityService {
    QualityResult check(String imageUrl);
}
