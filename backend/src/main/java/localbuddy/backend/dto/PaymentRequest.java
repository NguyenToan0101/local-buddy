package localbuddy.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class PaymentRequest {
    private UUID bookingId;
    private BigDecimal amount;
    private String paymentMethod;
}
