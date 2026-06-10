package localbuddy.backend.service.verification;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.Map;

@Service
public class AiVerificationClient {

    private final RestClient restClient;

    public AiVerificationClient(
            @Value("${ai.service.base-url:${AI_SERVICE_BASE_URL:http://localhost:8001}}") String baseUrl,
            @Value("${ai.service.timeout-seconds:${AI_SERVICE_TIMEOUT_SECONDS:30}}") long timeoutSeconds
    ) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(timeoutSeconds));
        requestFactory.setReadTimeout(Duration.ofSeconds(timeoutSeconds));
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    public AiOcrResponse ocr(String imageUrl) {
        return restClient.post()
                .uri("/ocr")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new OcrRequest(imageUrl))
                .retrieve()
                .body(AiOcrResponse.class);
    }

    public AiFaceMatchResponse faceMatch(String idCardImageUrl, String selfieImageUrl) {
        return restClient.post()
                .uri("/face-match")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new FaceMatchRequest(idCardImageUrl, selfieImageUrl))
                .retrieve()
                .body(AiFaceMatchResponse.class);
    }

    public AiQualityResponse quality(String imageUrl) {
        return restClient.post()
                .uri("/quality")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new QualityRequest(imageUrl))
                .retrieve()
                .body(AiQualityResponse.class);
    }

    public AiLivenessResponse liveness(String mediaUrl) {
        return restClient.post()
                .uri("/liveness")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new LivenessRequest(mediaUrl, java.util.List.of("blink", "left", "right")))
                .retrieve()
                .body(AiLivenessResponse.class);
    }

    public AiAntiSpoofResponse antiSpoof(String mediaUrl) {
        return restClient.post()
                .uri("/anti-spoof")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new AntiSpoofRequest(mediaUrl))
                .retrieve()
                .body(AiAntiSpoofResponse.class);
    }

    public boolean isHealthy() {
        try {
            Map<?, ?> response = restClient.get()
                    .uri("/health")
                    .retrieve()
                    .body(Map.class);
            return response != null && "ok".equals(String.valueOf(response.get("status")));
        } catch (RuntimeException e) {
            return false;
        }
    }

    private record OcrRequest(String imageUrl) {
    }

    private record FaceMatchRequest(String idCardImageUrl, String selfieImageUrl) {
    }

    private record QualityRequest(String imageUrl) {
    }

    private record LivenessRequest(String mediaUrl, java.util.List<String> challenge) {
    }

    private record AntiSpoofRequest(String mediaUrl) {
    }

    public record AiOcrResponse(
            Boolean success,
            String fullName,
            String idNumber,
            String dateOfBirth,
            String rawText,
            Double ocrScore,
            String message
    ) {
    }

    public record AiFaceMatchResponse(
            Boolean success,
            Double score,
            Boolean matched,
            String message
    ) {
    }

    public record AiQualityResponse(
            Boolean qualityPassed,
            Double qualityScore,
            java.util.Map<String, Object> details
    ) {
    }

    public record AiLivenessResponse(
            Boolean livenessPassed,
            Double livenessScore,
            java.util.Map<String, Object> details
    ) {
    }

    public record AiAntiSpoofResponse(
            Boolean isSpoof,
            Double spoofScore,
            java.util.Map<String, Object> details
    ) {
    }
}
