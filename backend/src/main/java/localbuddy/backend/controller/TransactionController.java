package localbuddy.backend.controller;

import localbuddy.backend.dto.CreatePayoutRequestDto;
import localbuddy.backend.dto.EarningsTransactionDto;
import localbuddy.backend.dto.PayoutRequestDto;
import localbuddy.backend.service.EarningsService;
import localbuddy.backend.service.PayoutRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final EarningsService earningsService;
    private final PayoutRequestService payoutRequestService;

    /**
     * GET /api/transactions
     * Returns the current authenticated buddy's earnings transactions.
     */
    @GetMapping
    public ResponseEntity<List<EarningsTransactionDto>> getTransactions() {
        return ResponseEntity.ok(earningsService.getTransactions(getCurrentUserId()));
    }

    /**
     * POST /api/transactions
     * Backward-compat endpoint: buddies submitting a withdrawal request via the old transaction API.
     * Delegates to the PayoutRequestService.
     */
    @PostMapping
    public ResponseEntity<PayoutRequestDto> createTransaction(@RequestBody CreatePayoutRequestDto dto) {
        UUID buddyId = getCurrentUserId();
        PayoutRequestDto result = payoutRequestService.createRequest(buddyId, dto);
        return ResponseEntity.ok(result);
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
}
