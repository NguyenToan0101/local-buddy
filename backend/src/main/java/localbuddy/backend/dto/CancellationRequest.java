package localbuddy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CancellationRequest {
    @NotBlank(message = "Cancellation reason is required.")
    @Size(max = 2000, message = "Reason must be at most 2000 characters.")
    private String reason;
}
