package localbuddy.backend.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class PaymentDto {
    private UUID id;
    private UUID bookingId;
    private UUID payerId;
    private String paymentType;
    private BigDecimal amount;
    private String status;
    private String paymentMethod;
    private String transactionReference;
    private OffsetDateTime createdAt;
    private OffsetDateTime paidAt;
}
