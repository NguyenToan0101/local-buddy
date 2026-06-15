package localbuddy.backend.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@Builder
public class QrTokenResponse {
    private String token;
    private OffsetDateTime expiresAt;
    private String qrPayload;
}
