package localbuddy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminVerificationUpdateRequest {
    @NotBlank(message = "Status is required.")
    @Pattern(regexp = "verified|rejected|pending|VERIFIED|REJECTED|PENDING", message = "Status must be pending, verified, or rejected.")
    private String status;

    private String reason;
}
