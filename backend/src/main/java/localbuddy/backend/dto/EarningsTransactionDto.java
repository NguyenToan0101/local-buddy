package localbuddy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EarningsTransactionDto {
    private UUID id;
    private UUID buddyId;
    private UUID bookingId;
    private String type;
    private BigDecimal amount;
    private String description;
    private String activity;
    private String client;
    private String target;
    private String date;
    private String createdAt;
}
