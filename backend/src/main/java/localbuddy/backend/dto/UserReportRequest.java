package localbuddy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class UserReportRequest {
    @NotNull(message = "Reported user ID is required.")
    private UUID reportedUserId;

    @NotBlank(message = "Reason is required.")
    @Size(max = 255, message = "Reason must be at most 255 characters.")
    private String reason;

    @Size(max = 2000, message = "Description must be at most 2000 characters.")
    private String description;

    @Size(max = 2000, message = "Evidence URL must be at most 2000 characters.")
    private String evidenceUrl;
}
