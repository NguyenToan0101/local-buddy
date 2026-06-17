package localbuddy.backend.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class TrackingEventResponse {
    private UUID id;
    private String sessionKey;
    private String eventType;
    private String pageUrl;
    private OffsetDateTime createdAt;
}
