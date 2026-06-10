package localbuddy.backend.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class VerificationResultDto {
    private String status;
    private String extractedFullName;
    private String extractedIdNumber;
    private String extractedDateOfBirth;
    private Double faceMatchScore;
    private Double livenessScore;
    private Double verificationScore;
    private String rejectionReason;
    private String autoVerificationMessage;
    private Double qualityScore;
    private Double antiSpoofScore;
    private Double riskScore;
    private String riskReason;
    private Boolean duplicateDetected;
    private String livenessDetails;
    private String antiSpoofDetails;
}
