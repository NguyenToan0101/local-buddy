package localbuddy.backend.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class ReviewDto {
    private UUID id;
    private UUID bookingId;
    private UUID reviewerId;
    private UUID revieweeId;
    private Short rating;
    private String comment;
    private Boolean isPublic;
    private OffsetDateTime createdAt;
}
