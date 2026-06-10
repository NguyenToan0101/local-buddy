package localbuddy.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class PayPalOrderRequest {
    private String orderId;
    private String paypalOrderId;
    
    @Getter
    @Setter
    public static class Details {
        private Map<String, Object> purchase_units;
        private Map<String, String> payer;
    }
}
