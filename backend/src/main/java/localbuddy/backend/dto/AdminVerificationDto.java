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
    private String extractedFullName;
    private String extractedIdNumber;
    private String extractedDateOfBirth;
    private Double ocrScore;
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
    private UUID duplicateUserId;
    private String livenessDetails;
    private String antiSpoofDetails;

    @Getter
    @Builder
    public static class Documents {
        private String front;
        private String back;
        private String selfie;
    }
}
