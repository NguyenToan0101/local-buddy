package localbuddy.backend.controller;

import localbuddy.backend.dto.AvailabilitySlotDto;
import localbuddy.backend.service.AvailabilitySlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/buddies/{buddyId}/availabilities")
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
        return ResponseEntity.ok(availabilitySlotService.addAvailability(buddyId, dto));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<AvailabilitySlotDto>> addAvailabilitiesBulk(
            @PathVariable UUID buddyId,
            @RequestBody List<AvailabilitySlotDto> dtos) {
        return ResponseEntity.ok(availabilitySlotService.addAvailabilitiesBulk(buddyId, dtos));
    }

    @DeleteMapping("/{slotId}")
    public ResponseEntity<Void> deleteAvailability(
            @PathVariable UUID buddyId,
            @PathVariable UUID slotId) {
        availabilitySlotService.deleteAvailability(buddyId, slotId);
        return ResponseEntity.noContent().build();
    }
}
