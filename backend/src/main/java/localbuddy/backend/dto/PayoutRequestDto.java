package localbuddy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayoutRequestDto {
    private UUID id;
    private UUID buddyId;
    private String buddyName;
    private String buddyImage;
    private BigDecimal amount;
    private BigDecimal taxRate;
    private String bankName;
    private String bankAccountName;
    private String bankAccountNumber;
    private String status;
    private OffsetDateTime requestedAt;
    private OffsetDateTime processedAt;
    private String rejectReason;
}
