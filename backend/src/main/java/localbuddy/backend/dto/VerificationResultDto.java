package localbuddy.backend.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class VerificationResultDto {
    private String status;
    private Double verificationScore;
    private String rejectionReason;
    private String autoVerificationMessage;
    private Double riskScore;
    private String riskReason;
    private Boolean duplicateDetected;
}
