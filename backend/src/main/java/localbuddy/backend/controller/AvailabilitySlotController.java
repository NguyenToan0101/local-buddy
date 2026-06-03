package localbuddy.backend.controller;

import localbuddy.backend.dto.AvailabilitySlotDto;
import localbuddy.backend.service.AvailabilitySlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/buddies/{buddyId}/availabilities", "/api/buddies/{buddyId}/availabilities"})
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AvailabilitySlotController {

    private final AvailabilitySlotService availabilitySlotService;

    @GetMapping
    public ResponseEntity<List<AvailabilitySlotDto>> getAvailabilities(@PathVariable UUID buddyId) {
        return ResponseEntity.ok(availabilitySlotService.getAvailabilitiesByBuddy(buddyId));
    }

    @PostMapping
    public ResponseEntity<AvailabilitySlotDto> addAvailability(
            @PathVariable UUID buddyId,
            @RequestBody AvailabilitySlotDto dto) {
        requireBuddyOwnerOrAdmin(buddyId);
        return ResponseEntity.ok(availabilitySlotService.addAvailability(buddyId, dto));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<AvailabilitySlotDto>> addAvailabilitiesBulk(
            @PathVariable UUID buddyId,
            @RequestBody List<AvailabilitySlotDto> dtos) {
        requireBuddyOwnerOrAdmin(buddyId);
        return ResponseEntity.ok(availabilitySlotService.addAvailabilitiesBulk(buddyId, dtos));
    }

    @DeleteMapping("/{slotId}")
    public ResponseEntity<Void> deleteAvailability(
            @PathVariable UUID buddyId,
            @PathVariable UUID slotId) {
        requireBuddyOwnerOrAdmin(buddyId);
        availabilitySlotService.deleteAvailability(buddyId, slotId);
        return ResponseEntity.noContent().build();
    }

    private void requireBuddyOwnerOrAdmin(UUID buddyId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("User not authenticated.");
        }

        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
        if (admin) {
            return;
        }

        Object credentials = authentication.getCredentials();
        if (!(credentials instanceof String currentUserId) || !buddyId.equals(UUID.fromString(currentUserId))) {
            throw new AccessDeniedException("Only the buddy who owns this profile can manage availabilities.");
        }
    }
}
