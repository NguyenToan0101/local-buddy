package localbuddy.backend.service.verification;

public record OcrResult(
        boolean valid,
        String fullName,
        String idNumber,
        String dateOfBirth,
        String message,
        double ocrScore,
        String rawText
) {
}
