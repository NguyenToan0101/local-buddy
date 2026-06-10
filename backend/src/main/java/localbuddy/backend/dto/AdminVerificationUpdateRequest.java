package localbuddy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminVerificationUpdateRequest {
    @NotBlank(message = "Status is required.")
    @Pattern(regexp = "verified|rejected|pending|manual_approved|manual_rejected|manual_review|VERIFIED|REJECTED|PENDING|MANUAL_APPROVED|MANUAL_REJECTED|MANUAL_REVIEW", message = "Status must be a supported verification status.")
    private String status;

    private String reason;
}
