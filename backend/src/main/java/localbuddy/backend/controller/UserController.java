package localbuddy.backend.controller;

import localbuddy.backend.model.entity.User;
import localbuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class UserController {

    private final UserRepository userRepository;

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
            response.put("avatarUrl", savedUser.getAvatarUrl());
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
            response.put("avatarUrl", avatarUrl);
            
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
}