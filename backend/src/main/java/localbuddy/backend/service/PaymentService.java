package localbuddy.backend.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import localbuddy.backend.dto.PaymentDto;
import localbuddy.backend.dto.PaymentRequest;
import localbuddy.backend.model.entity.Booking;
import localbuddy.backend.model.entity.Payment;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.model.enums.BookingStatus;
import localbuddy.backend.model.enums.PaymentStatus;
import localbuddy.backend.model.enums.PaymentType;
import localbuddy.backend.repository.BookingRepository;
import localbuddy.backend.repository.PaymentRepository;
import localbuddy.backend.repository.UserRepository;
import localbuddy.backend.service.EarningsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    @Value("${paypal.client-id}")
    private String paypalClientId;

    @Value("${paypal.client-secret}")
    private String paypalClientSecret;

    @Value("${paypal.mode:sandbox}")
    private String paypalMode;

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final EarningsService earningsService;

    private static final String PAYPAL_SANDBOX_URL = "https://api-m.sandbox.paypal.com";
    private static final String PAYPAL_LIVE_URL = "https://api-m.paypal.com";
    private static final OkHttpClient httpClient = new OkHttpClient();
    private static final Gson gson = new Gson();

    public String getPayPalApiUrl() {
        return "sandbox".equals(paypalMode) ? PAYPAL_SANDBOX_URL : PAYPAL_LIVE_URL;
    }

    /**
     * Create PayPal order
     */
    public java.util.Map<String, Object> createPayPalOrder(UUID bookingId, UUID payerId) throws Exception {
        validatePayPalConfig();
        
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        // Create order request
        JsonObject orderRequest = new JsonObject();
        orderRequest.addProperty("intent", "CAPTURE");

        JsonObject purchaseUnit = new JsonObject();
        purchaseUnit.addProperty("reference_id", bookingId.toString());

        JsonObject amount = new JsonObject();
        amount.addProperty("currency_code", "USD");
        amount.addProperty("value", booking.getTotalPrice().setScale(2, java.math.RoundingMode.HALF_UP).toString());

        purchaseUnit.add("amount", amount);

        JsonObject[] purchaseUnits = {purchaseUnit};
        orderRequest.add("purchase_units", gson.toJsonTree(purchaseUnits));

        // Make API call to PayPal
        String accessToken = getPayPalAccessToken();
        JsonObject response = createPayPalOrderApiCall(orderRequest, accessToken);
        
        // Convert JsonObject to Map for proper serialization
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("id", response.get("id").getAsString());
        result.put("status", response.get("status").getAsString());
        return result;
    }

    /**
     * Capture PayPal order
     */
    @Transactional
    public PaymentDto capturePayPalOrder(String paypalOrderId, UUID bookingId, UUID payerId) throws Exception {
        String accessToken = getPayPalAccessToken();
        JsonObject captureResponse = capturePayPalOrderApiCall(paypalOrderId, accessToken);

        if (!captureResponse.get("status").getAsString().equals("COMPLETED")) {
            throw new IllegalArgumentException("PayPal payment failed with status: " + captureResponse.get("status").getAsString());
        }

        // Extract transaction details
        String transactionId = captureResponse
                .getAsJsonArray("purchase_units")
                .get(0).getAsJsonObject()
                .getAsJsonObject("payments")
                .getAsJsonArray("captures")
                .get(0).getAsJsonObject()
                .get("id")
                .getAsString();

        // Save payment record
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        // If payerId is null, use the booking traveler as payer
        User payer;
        if (payerId != null) {
            payer = userRepository.findById(payerId)
                    .orElseThrow(() -> new IllegalArgumentException("Payer not found"));
        } else {
            payer = booking.getTraveler();
        }

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setPayer(payer);
        payment.setPaymentType(PaymentType.FULL_PAYMENT);
        payment.setAmount(booking.getTotalPrice());
        payment.setStatus(PaymentStatus.HELD);
        payment.setPaymentMethod("PAYPAL");
        payment.setTransactionReference(transactionId);
        payment.setCreatedAt(OffsetDateTime.now());
        payment.setPaidAt(OffsetDateTime.now());

        Payment savedPayment = paymentRepository.save(payment);

        // Update booking status to CONFIRMED
        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        // Create INCOME earnings transaction for the buddy
        if (booking.getBuddy() != null) {
            String incomeDescription = "Payment received for booking: " + booking.getTitle();
            earningsService.createIncomeTransaction(
                    booking.getBuddy().getId(),
                    booking,
                    booking.getTotalPrice(),
                    incomeDescription
            );
        }

        return convertToDto(savedPayment);
    }

    /**
     * Get payment details
     */
    public PaymentDto getPayment(UUID paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        return convertToDto(payment);
    }

    /**
     * Get payments for a booking
     */
    public java.util.List<PaymentDto> getBookingPayments(UUID bookingId) {
        return paymentRepository.findByBookingId(bookingId)
                .stream()
                .map(this::convertToDto)
                .toList();
    }

    /**
     * Get PayPal access token
     */
    private String getPayPalAccessToken() throws IOException {
        if (paypalClientId == null || paypalClientId.isEmpty()) {
            throw new IllegalArgumentException("PayPal Client ID is not configured");
        }
        if (paypalClientSecret == null || paypalClientSecret.isEmpty()) {
            throw new IllegalArgumentException("PayPal Client Secret is not configured");
        }

        String auth = paypalClientId + ":" + paypalClientSecret;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());

        RequestBody body = RequestBody.create("grant_type=client_credentials", MediaType.get("application/x-www-form-urlencoded"));

        String tokenUrl = getPayPalApiUrl() + "/v1/oauth2/token";
        log.info("Requesting PayPal token from: {}", tokenUrl);

        Request request = new Request.Builder()
                .url(tokenUrl)
                .header("Authorization", "Basic " + encodedAuth)
                .post(body)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            String responseBody = response.body() != null ? response.body().string() : "";
            
            if (!response.isSuccessful()) {
                log.error("PayPal token request failed. Status: {}, URL: {}, Body: {}", 
                    response.code(), tokenUrl, responseBody);
                throw new IOException("Failed to get PayPal access token. Status: " + response.code() + 
                    ". If 401, check your PayPal credentials. Details: " + responseBody);
            }

            JsonObject responseJson = gson.fromJson(responseBody, JsonObject.class);
            log.info("PayPal token request successful");
            return responseJson.get("access_token").getAsString();
        }
    }

    /**
     * Validate PayPal configuration
     */
    private void validatePayPalConfig() {
        if (paypalClientId == null || paypalClientId.isEmpty()) {
            throw new IllegalArgumentException("PayPal Client ID is not configured. Please set PAYPAL_CLIENT_ID environment variable.");
        }
        if (paypalClientSecret == null || paypalClientSecret.isEmpty()) {
            throw new IllegalArgumentException("PayPal Client Secret is not configured. Please set PAYPAL_CLIENT_SECRET environment variable.");
        }
    }

    /**
     * Check if PayPal is configured
     */
    public String isPayPalConfigured() {
        boolean clientIdOk = paypalClientId != null && !paypalClientId.isEmpty();
        boolean secretOk = paypalClientSecret != null && !paypalClientSecret.isEmpty();
        
        if (clientIdOk && secretOk) {
            return "true";
        }
        
        StringBuilder msg = new StringBuilder("false - ");
        if (!clientIdOk) msg.append("PAYPAL_CLIENT_ID missing; ");
        if (!secretOk) msg.append("PAYPAL_CLIENT_SECRET missing");
        return msg.toString();
    }

    /**
     * Create PayPal order API call
     */
    private JsonObject createPayPalOrderApiCall(JsonObject orderRequest, String accessToken) throws IOException {
        RequestBody body = RequestBody.create(gson.toJson(orderRequest), MediaType.get("application/json"));

        Request request = new Request.Builder()
                .url(getPayPalApiUrl() + "/v2/checkout/orders")
                .header("Authorization", "Bearer " + accessToken)
                .header("Content-Type", "application/json")
                .post(body)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                log.error("PayPal order creation failed: {}", response.body().string());
                throw new IOException("Failed to create PayPal order");
            }

            return gson.fromJson(response.body().string(), JsonObject.class);
        }
    }

    /**
     * Capture PayPal order API call
     */
    private JsonObject capturePayPalOrderApiCall(String orderId, String accessToken) throws IOException {
        Request request = new Request.Builder()
                .url(getPayPalApiUrl() + "/v2/checkout/orders/" + orderId + "/capture")
                .header("Authorization", "Bearer " + accessToken)
                .header("Content-Type", "application/json")
                .post(RequestBody.create("", MediaType.get("application/json")))
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                log.error("PayPal order capture failed: {}", response.body().string());
                throw new IOException("Failed to capture PayPal order");
            }

            return gson.fromJson(response.body().string(), JsonObject.class);
        }
    }

    private PaymentDto convertToDto(Payment payment) {
        return PaymentDto.builder()
                .id(payment.getId())
                .bookingId(payment.getBooking().getId())
                .payerId(payment.getPayer().getId())
                .paymentType(payment.getPaymentType().toString())
                .amount(payment.getAmount())
                .status(payment.getStatus().toString())
                .paymentMethod(payment.getPaymentMethod())
                .transactionReference(payment.getTransactionReference())
                .createdAt(payment.getCreatedAt())
                .paidAt(payment.getPaidAt())
                .build();
    }
}
