package localbuddy.backend.controller;

import localbuddy.backend.dto.TouristProfileRequest;
import localbuddy.backend.dto.TouristProfileResponse;
import localbuddy.backend.service.TouristProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/tourist-profile")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class TouristProfileController {

    private final TouristProfileService touristProfileService;

    @PostMapping
    public ResponseEntity<?> createProfile(@RequestBody TouristProfileRequest request) {
        log.info("Received create profile request: {}", request);
        try {
            UUID userId = getCurrentUserId();
            requireTraveler();
            log.info("Creating profile for user ID: {}", userId);
            TouristProfileResponse response = touristProfileService.createProfile(userId, request);
            log.info("Profile created successfully: {}", response);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (RuntimeException e) {
            log.error("Error creating profile: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@RequestBody TouristProfileRequest request) {
        try {
            UUID userId = getCurrentUserId();
            requireTraveler();
            TouristProfileResponse response = touristProfileService.updateProfile(userId, request);
            return ResponseEntity.ok(response);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping
    public ResponseEntity<?> getProfile() {
        try {
            UUID userId = getCurrentUserId();
            TouristProfileResponse response = touristProfileService.getProfile(userId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/exists")
    public ResponseEntity<Map<String, Boolean>> checkProfileExists() {
        UUID userId = getCurrentUserId();
        boolean exists = touristProfileService.hasProfile(userId);
        Map<String, Boolean> response = new HashMap<>();
        response.put("exists", exists);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping
    public ResponseEntity<?> deleteProfile() {
        try {
            UUID userId = getCurrentUserId();
            requireTraveler();
            touristProfileService.deleteProfile(userId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Profile deleted successfully");
            return ResponseEntity.ok(response);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String userIdStr = (String) authentication.getCredentials();
        if (userIdStr == null) {
            throw new RuntimeException("User ID not found in authentication");
        }
        
        try {
            return UUID.fromString(userIdStr);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid user ID format");
        }
    }

    private void requireTraveler() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean traveler = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_TRAVELER".equals(authority.getAuthority()));
        if (!traveler) {
            throw new AccessDeniedException("Only travelers can manage tourist profiles.");
        }
    }
}
