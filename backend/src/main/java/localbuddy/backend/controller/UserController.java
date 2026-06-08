package localbuddy.backend.controller;

import localbuddy.backend.dto.UserDto;
import localbuddy.backend.model.entity.BuddyProfile;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.model.enums.UserRole;
import localbuddy.backend.model.enums.VerificationStatus;
import localbuddy.backend.repository.BuddyProfileRepository;
import localbuddy.backend.repository.UserRepository;
import localbuddy.backend.service.AvatarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/user", "/api/users"})
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class UserController {

    private final UserRepository userRepository;
    private final BuddyProfileRepository buddyProfileRepository;

    @GetMapping("/me")
    public ResponseEntity<UserDto> getMe() {
        User user = userRepository.findById(getCurrentUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        return ResponseEntity.ok(mapToDto(user));
    }

    @PutMapping("/me")
    public ResponseEntity<UserDto> updateMe(@RequestBody UserDto request) {
        User user = userRepository.findById(getCurrentUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        updateUserFields(user, request);
        user.setUpdatedAt(java.time.OffsetDateTime.now());
        return ResponseEntity.ok(mapToDto(userRepository.save(user)));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserDto> getById(@PathVariable UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        return ResponseEntity.ok(mapToDto(user));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> request) {
        try {
            UUID userId = getCurrentUserId();
            
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Update user fields
            if (request.containsKey("name")) {
                user.setFullName((String) request.get("name"));
            }
            if (request.containsKey("phone")) {
                user.setPhone((String) request.get("phone"));
            }
            if (request.containsKey("avatar")) {
                user.setAvatarUrl((String) request.get("avatar"));
            }
            
            User savedUser = userRepository.save(user);
            
            // Return user data
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedUser.getId());
            response.put("email", savedUser.getEmail());
            response.put("fullName", savedUser.getFullName());
            response.put("avatarUrl", AvatarService.getDisplayAvatarUrl(savedUser));
            response.put("googleAvatarUrl", savedUser.getGoogleAvatarUrl());
            response.put("displayAvatarUrl", AvatarService.getDisplayAvatarUrl(savedUser));
            response.put("role", savedUser.getRole().name());
            response.put("phone", savedUser.getPhone());
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PutMapping("/avatar")
    public ResponseEntity<?> updateAvatar(@RequestBody Map<String, String> request) {
        try {
            UUID userId = getCurrentUserId();
            String avatarUrl = request.get("avatarUrl");
            
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            user.setAvatarUrl(avatarUrl);
            userRepository.save(user);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Avatar updated successfully");
            response.put("avatarUrl", AvatarService.getDisplayAvatarUrl(user));
            response.put("googleAvatarUrl", user.getGoogleAvatarUrl());
            response.put("displayAvatarUrl", AvatarService.getDisplayAvatarUrl(user));
            
            return ResponseEntity.ok(response);
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

    private void updateUserFields(User user, UserDto request) {
        if (request.getName() != null) {
            user.setFullName(request.getName());
        } else if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getAvatar() != null) {
            user.setAvatarUrl(request.getAvatar());
        } else if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
    }

    private UserDto mapToDto(User user) {
        BuddyProfile profile = user.getRole() == UserRole.BUDDY
                ? buddyProfileRepository.findByUserId(user.getId()).orElse(null)
                : null;
        String avatar = AvatarService.getDisplayAvatarUrl(user);

        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getFullName())
                .fullName(user.getFullName())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .avatar(avatar)
                .avatarUrl(user.getAvatarUrl())
                .googleAvatarUrl(user.getGoogleAvatarUrl())
                .displayAvatarUrl(avatar)
                .phone(user.getPhone())
                .location(profile != null ? profile.getLocation() : null)
                .verificationStatus(resolveVerificationStatus(user, profile))
                .build();
    }

    private String resolveVerificationStatus(User user, BuddyProfile profile) {
        if (user.getRole() != UserRole.BUDDY) {
            return Boolean.TRUE.equals(user.getIsActive()) ? "verified" : "pending";
        }
        VerificationStatus status = profile != null && profile.getVerificationStatus() != null
                ? profile.getVerificationStatus()
                : VerificationStatus.PENDING;
        return switch (status) {
            case VERIFIED -> "verified";
            case REJECTED -> "rejected";
            case PENDING -> "pending";
        };
    }
}
