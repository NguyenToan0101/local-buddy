package localbuddy.backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class AdminVerificationDto {
    private UUID id;
    private String name;
    private String type;
    private String regDate;
    private String docType;
    private String status;
    private String avatar;
    private Documents docs;
    private String email;
    private String phone;

    @Getter
    @Builder
    public static class Documents {
        private String front;
        private String back;
        private String selfie;
    }
}
