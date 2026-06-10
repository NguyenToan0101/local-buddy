package localbuddy.backend.service.verification;

public interface LivenessDetectionService {
    default double detect(String selfieOrVideoUrl) {
        return analyze(selfieOrVideoUrl).score();
    }

    LivenessResult analyze(String selfieOrVideoUrl);
}
