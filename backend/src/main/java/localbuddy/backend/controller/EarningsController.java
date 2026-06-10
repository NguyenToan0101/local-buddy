package localbuddy.backend.controller;

import localbuddy.backend.dto.EarningsSummaryDto;
import localbuddy.backend.dto.EarningsTransactionDto;
import localbuddy.backend.service.EarningsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/earnings")
@RequiredArgsConstructor
public class EarningsController {

    private final EarningsService earningsService;

    @GetMapping
    public ResponseEntity<Map<String, List<EarningsTransactionDto>>> getEarnings() {
        return ResponseEntity.ok(Map.of("transactions", earningsService.getTransactions(getCurrentUserId())));
    }

    @GetMapping("/summary")
    public ResponseEntity<EarningsSummaryDto> getSummary() {
        return ResponseEntity.ok(earningsService.getSummary(getCurrentUserId()));
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
