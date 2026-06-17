package localbuddy.backend.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class UserReportDto {
    private UUID id;
    private UUID reportedUserId;
    private UUID reporterId;
    private String reason;
    private String description;
    private String evidenceUrl;
    private OffsetDateTime createdAt;
}
