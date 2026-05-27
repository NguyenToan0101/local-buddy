package localbuddy.backend.controller;

import localbuddy.backend.dto.BuddyAvailabilityDto;
import localbuddy.backend.service.BuddyAvailabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/buddies/{buddyId}/availabilities")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class BuddyAvailabilityController {

    private final BuddyAvailabilityService buddyAvailabilityService;

    @GetMapping
    public ResponseEntity<List<BuddyAvailabilityDto>> getAvailabilities(@PathVariable UUID buddyId) {
        return ResponseEntity.ok(buddyAvailabilityService.getAvailabilitiesByBuddy(buddyId));
    }

    @PostMapping
    public ResponseEntity<BuddyAvailabilityDto> addAvailability(
            @PathVariable UUID buddyId,
            @RequestBody BuddyAvailabilityDto dto) {
        return ResponseEntity.ok(buddyAvailabilityService.addAvailability(buddyId, dto));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<BuddyAvailabilityDto>> addAvailabilitiesBulk(
            @PathVariable UUID buddyId,
            @RequestBody List<BuddyAvailabilityDto> dtos) {
        return ResponseEntity.ok(buddyAvailabilityService.addAvailabilitiesBulk(buddyId, dtos));
    }

    @DeleteMapping("/{slotId}")
    public ResponseEntity<Void> deleteAvailability(
            @PathVariable UUID buddyId,
            @PathVariable UUID slotId) {
        buddyAvailabilityService.deleteAvailability(buddyId, slotId);
        return ResponseEntity.noContent().build();
    }
}
