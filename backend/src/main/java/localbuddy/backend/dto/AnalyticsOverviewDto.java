package localbuddy.backend.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class AnalyticsOverviewDto {
    private long totalEvents;
    private long uniqueSessions;
    private long loggedInUsers;
}
