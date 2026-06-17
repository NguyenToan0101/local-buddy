package localbuddy.backend.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AnalyticsTrafficSourceDto {
    String trafficSource;
    Long sessions;
}
