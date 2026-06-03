package localbuddy.backend.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminDashboardStatsDto {
    private long users;
    private long travelers;
    private long buddies;
    private long pendingVerifications;
    private long verifiedBuddies;
    private long rejectedBuddies;
}
