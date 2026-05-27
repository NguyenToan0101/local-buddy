package localbuddy.backend.controller;

import localbuddy.backend.dto.BuddyProfileDto;
import localbuddy.backend.service.BuddyProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/buddies")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class BuddyProfileController {

    private final BuddyProfileService buddyProfileService;

    @GetMapping("/{userId}")
    public ResponseEntity<BuddyProfileDto> getProfile(@PathVariable UUID userId) {
        return ResponseEntity.ok(buddyProfileService.getProfileByUserId(userId));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<BuddyProfileDto> updateProfile(@PathVariable UUID userId, @RequestBody BuddyProfileDto dto) {
        return ResponseEntity.ok(buddyProfileService.updateProfile(userId, dto));
    }

    @GetMapping
    public ResponseEntity<List<BuddyProfileDto>> getAll() {
        return ResponseEntity.ok(buddyProfileService.getAllBuddies());
    }
}
