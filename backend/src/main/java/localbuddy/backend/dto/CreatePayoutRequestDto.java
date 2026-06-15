package localbuddy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreatePayoutRequestDto {
    private BigDecimal amount;
    private String bankName;
    private String bankAccountName;
    private String bankAccountNumber;
}
