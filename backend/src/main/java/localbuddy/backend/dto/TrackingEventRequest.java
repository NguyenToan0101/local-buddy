package localbuddy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class TrackingEventRequest {
    @NotBlank(message = "Session key is required.")
    @Size(max = 255, message = "Session key must be at most 255 characters.")
    private String sessionKey;

    @NotBlank(message = "Event type is required.")
    @Size(max = 100, message = "Event type must be at most 100 characters.")
    private String eventType;

    @Size(max = 2000, message = "Page URL must be at most 2000 characters.")
    private String pageUrl;

    private Map<String, Object> metadata;
}
