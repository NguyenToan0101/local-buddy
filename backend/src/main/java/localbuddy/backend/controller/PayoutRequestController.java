package localbuddy.backend.controller;

import localbuddy.backend.dto.CreatePayoutRequestDto;
import localbuddy.backend.dto.PayoutRequestDto;
import localbuddy.backend.service.PayoutRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payout-requests")
@RequiredArgsConstructor
public class PayoutRequestController {

    private final PayoutRequestService payoutRequestService;

    /**
     * Buddy submits a new withdrawal request.
     * POST /api/payout-requests
     */
    @PostMapping
    public ResponseEntity<PayoutRequestDto> createRequest(@RequestBody CreatePayoutRequestDto dto) {
        UUID buddyId = getCurrentUserId();
        PayoutRequestDto result = payoutRequestService.createRequest(buddyId, dto);
        return ResponseEntity.ok(result);
    }

    /**
     * Admin: get all payout requests.
     * GET /api/payout-requests
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PayoutRequestDto>> getAllRequests() {
        return ResponseEntity.ok(payoutRequestService.getAllRequests());
    }

    /**
     * Admin: get only PENDING payout requests.
     * GET /api/payout-requests/pending
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PayoutRequestDto>> getPendingRequests() {
        return ResponseEntity.ok(payoutRequestService.getPendingRequests());
    }

    /**
     * Admin approves a withdrawal request.
     * PATCH /api/payout-requests/{id}/approve
     */
    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PayoutRequestDto> approveRequest(@PathVariable UUID id) {
        PayoutRequestDto result = payoutRequestService.approveRequest(id);
        return ResponseEntity.ok(result);
    }

    /**
     * Admin rejects a withdrawal request.
     * PATCH /api/payout-requests/{id}/reject
     * Body: { "reason": "..." }
     */
    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PayoutRequestDto> rejectRequest(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String reason = body != null ? body.getOrDefault("reason", "") : "";
        PayoutRequestDto result = payoutRequestService.rejectRequest(id, reason);
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
