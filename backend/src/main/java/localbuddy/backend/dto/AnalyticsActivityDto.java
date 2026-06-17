package localbuddy.backend.dto;

import lombok.Builder;
import lombok.Value;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Value
@Builder
public class AnalyticsActivityDto {
    UUID eventId;
    String sessionKey;
    UUID userId;
    String userName;
    String userEmail;
    String userRole;
    String eventType;
    String pageUrl;
    Map<String, Object> metadata;
    String trafficSource;
    String referrer;
    String landingPage;
    OffsetDateTime createdAt;
}
