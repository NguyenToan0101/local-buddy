package localbuddy.backend.controller;

import com.google.gson.JsonObject;
import localbuddy.backend.dto.PaymentDto;
import localbuddy.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Create a PayPal order
     */
    @PostMapping("/paypal/create-order")
    public ResponseEntity<java.util.Map<String, Object>> createPayPalOrder(@RequestParam UUID bookingId) throws Exception {
        UUID payerId = getCurrentUserIdOrNull();
        java.util.Map<String, Object> order = paymentService.createPayPalOrder(bookingId, payerId);
        return ResponseEntity.ok(order);
    }


    /**
     * Capture PayPal order and create payment record
     */
    @PostMapping("/paypal/capture-order")
    public ResponseEntity<PaymentDto> capturePayPalOrder(
            @RequestParam String orderId,
            @RequestParam UUID bookingId
    ) throws Exception {
        UUID payerId = getCurrentUserIdOrNull();
        PaymentDto payment = paymentService.capturePayPalOrder(orderId, bookingId, payerId);
        return ResponseEntity.ok(payment);
    }

    /**
     * Get payment details
     */
    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentDto> getPayment(@PathVariable UUID paymentId) {
        PaymentDto payment = paymentService.getPayment(paymentId);
        return ResponseEntity.ok(payment);
    }

    /**
     * Get all payments for a booking
     */
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<PaymentDto>> getBookingPayments(@PathVariable UUID bookingId) {
        List<PaymentDto> payments = paymentService.getBookingPayments(bookingId);
        return ResponseEntity.ok(payments);
    }

    /**
     * Debug endpoint - check PayPal configuration
     */
    @GetMapping("/health")
    public ResponseEntity<java.util.Map<String, String>> healthCheck() {
        java.util.Map<String, String> health = new java.util.HashMap<>();
        health.put("status", "ok");
        health.put("paypal_configured", paymentService.isPayPalConfigured());
        return ResponseEntity.ok(health);
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("User not authenticated.");
        }

        Object credentials = authentication.getCredentials();
        if (!(credentials instanceof String userId)) {
            throw new IllegalArgumentException("User ID not found in authentication.");
        }

        return UUID.fromString(userId);
    }

    private UUID getCurrentUserIdOrNull() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
                Object credentials = authentication.getCredentials();
                if (credentials instanceof String userId) {
                    return UUID.fromString(userId);
                }
            }
        } catch (Exception e) {
            // Return null if unable to get user ID
        }
        return null;
    }
}
