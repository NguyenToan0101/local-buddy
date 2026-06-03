package localbuddy.backend.controller;

import localbuddy.backend.dto.BuddyProfileDto;
import localbuddy.backend.service.BuddyProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/buddies", "/api/buddies"})
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class    BuddyProfileController {

    private final BuddyProfileService buddyProfileService;

    @GetMapping("/{userId}")
    public ResponseEntity<BuddyProfileDto> getProfile(@PathVariable UUID userId) {
        return ResponseEntity.ok(buddyProfileService.getProfileByUserId(userId));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<BuddyProfileDto> updateProfile(@PathVariable UUID userId, @RequestBody BuddyProfileDto dto) {
        return ResponseEntity.ok(buddyProfileService.updateProfile(userId, dto, getCurrentUserId(), isCurrentUserAdmin()));
    }

    @GetMapping
    public ResponseEntity<List<BuddyProfileDto>> getAll() {
        return ResponseEntity.ok(buddyProfileService.getAllBuddies());
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
