package localbuddy.backend.controller;

import localbuddy.backend.dto.BuddyProfileDto;
import localbuddy.backend.service.BuddyProfileService;
import localbuddy.backend.service.verification.AiVerificationClient;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/verifications")
@RequiredArgsConstructor
public class VerificationController {

    private final BuddyProfileService buddyProfileService;
    private final AiVerificationClient aiVerificationClient;

    @GetMapping("/ai-health")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAiHealth() {
        return ResponseEntity.ok(java.util.Map.of("healthy", aiVerificationClient.isHealthy()));
    }

    @GetMapping("/{userId}/result")
    public ResponseEntity<?> getResult(@PathVariable UUID userId) {
        return ResponseEntity.ok(buddyProfileService.getVerificationResult(userId, getCurrentUserId(), isCurrentUserAdmin()));
    }

    @PostMapping("/{userId}/retry-auto-verification")
    public ResponseEntity<BuddyProfileDto> retryAutoVerification(@PathVariable UUID userId) {
        return ResponseEntity.ok(buddyProfileService.retryAutoVerification(userId, getCurrentUserId(), isCurrentUserAdmin()));
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

    private boolean isCurrentUserAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}
