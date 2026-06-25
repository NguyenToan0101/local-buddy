package localbuddy.backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class AdminVerificationDto {
    private UUID id;
    private String name;
    private Integer age;
    private String type;
    private String regDate;
    private String docType;
    private String status;
    private String avatar;
    private Documents docs;
    private String email;
    private String phone;
    private String eVisaNumber;
    private String eVisaCountry;
    private String eVisaExpiryDate;
    private Double verificationScore;
    private String rejectionReason;
    private String autoVerificationMessage;
    private Double riskScore;
    private String riskReason;
    private Boolean duplicateDetected;
    private UUID duplicateUserId;

    @Getter
    @Builder
    public static class Documents {
        private String front;
        private String back;
        private String selfie;
    }
}
