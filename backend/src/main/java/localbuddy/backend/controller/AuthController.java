package localbuddy.backend.controller;

import jakarta.validation.Valid;
import localbuddy.backend.dto.AuthResponse;
import localbuddy.backend.dto.ForgotPasswordRequest;
import localbuddy.backend.dto.LoginRequest;
import localbuddy.backend.dto.RegisterRequest;
import localbuddy.backend.dto.ResetPasswordRequest;
import localbuddy.backend.dto.VerifyOtpRequest;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.repository.UserRepository;
import localbuddy.backend.service.AuthService;
import localbuddy.backend.service.AvatarService;
import localbuddy.backend.service.CloudinaryService;
import localbuddy.backend.service.JwtService;
import localbuddy.backend.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import localbuddy.backend.repository.BuddyProfileRepository;
import localbuddy.backend.model.enums.UserRole;
import localbuddy.backend.model.entity.BuddyProfile;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping({"/auth", "/api/auth"})
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuthService authService;
    private final BuddyProfileRepository buddyProfileRepository;
    private final PasswordResetService passwordResetService;
    private final CloudinaryService cloudinaryService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest registerRequest) {
        return ResponseEntity.ok(authService.register(registerRequest));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest verifyOtpRequest) {
        return ResponseEntity.ok(authService.verifyOtp(verifyOtpRequest.getEmail(), verifyOtpRequest.getOtp()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail().trim(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByEmail(loginRequest.getEmail().trim())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + loginRequest.getEmail()));

        String jwt = jwtService.generateToken(user.getEmail(), user.getId(), user.getRole().name());

        String verificationStatus = null;
        String location = null;
        if (user.getRole() == UserRole.BUDDY) {
            BuddyProfile buddyProfile = buddyProfileRepository.findByUserId(user.getId()).orElse(null);
            if (buddyProfile != null) {
                verificationStatus = buddyProfile.getVerificationStatus() != null ? buddyProfile.getVerificationStatus().name().toLowerCase() : "unverified";
                location = buddyProfile.getLocation();
            } else {
                verificationStatus = "unverified";
                location = "Not Specified";
            }
        }

        AuthResponse authResponse = AuthResponse.builder()
                .token(jwt)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(AvatarService.getDisplayAvatarUrl(user))
                .googleAvatarUrl(user.getGoogleAvatarUrl())
                .displayAvatarUrl(AvatarService.getDisplayAvatarUrl(user))
                .role(user.getRole().name())
                .phone(user.getPhone())
                .verificationStatus(verificationStatus)
                .location(location)
                .build();

        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestReset(request.getEmail());
        return ResponseEntity.ok(Map.of(
                "message",
                "If an active account exists for this email, a password reset link has been sent."
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Password has been reset successfully."));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String email = principal.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("fullName", user.getFullName());
        response.put("avatarUrl", AvatarService.getDisplayAvatarUrl(user));
        response.put("googleAvatarUrl", user.getGoogleAvatarUrl());
        response.put("displayAvatarUrl", AvatarService.getDisplayAvatarUrl(user));
        response.put("role", user.getRole().name());
        response.put("isBuddy", user.getIsBuddy());
        response.put("phone", user.getPhone());

        if (user.getRole() == UserRole.BUDDY) {
            BuddyProfile buddyProfile = buddyProfileRepository.findByUserId(user.getId()).orElse(null);
            if (buddyProfile != null) {
                response.put("verificationStatus", buddyProfile.getVerificationStatus() != null ? buddyProfile.getVerificationStatus().name().toLowerCase() : "unverified");
                response.put("location", buddyProfile.getLocation());
            } else {
                response.put("verificationStatus", "unverified");
                response.put("location", "Not Specified");
            }
        }

        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(Principal principal, @RequestBody Map<String, Object> updates) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String email = principal.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        if (updates.containsKey("name")) {
            user.setFullName((String) updates.get("name"));
        }
        if (updates.containsKey("avatar")) {
            String avatar = (String) updates.get("avatar");
            user.setAvatarUrl(cloudinaryService.uploadBase64ImageIfNeeded(
                    avatar,
                    "local-buddy/users/" + user.getId() + "/avatar"
            ));
        }
        if (updates.containsKey("phone")) {
            user.setPhone((String) updates.get("phone"));
        }
        user.setUpdatedAt(java.time.OffsetDateTime.now());
        User savedUser = userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("id", savedUser.getId());
        response.put("email", savedUser.getEmail());
        response.put("fullName", savedUser.getFullName());
        response.put("avatarUrl", AvatarService.getDisplayAvatarUrl(savedUser));
        response.put("googleAvatarUrl", savedUser.getGoogleAvatarUrl());
        response.put("displayAvatarUrl", AvatarService.getDisplayAvatarUrl(savedUser));
        response.put("role", savedUser.getRole().name());
        response.put("isBuddy", savedUser.getIsBuddy());

        if (savedUser.getRole() == UserRole.BUDDY) {
            BuddyProfile buddyProfile = buddyProfileRepository.findByUserId(savedUser.getId()).orElse(null);
            if (buddyProfile != null) {
                response.put("verificationStatus", buddyProfile.getVerificationStatus() != null ? buddyProfile.getVerificationStatus().name().toLowerCase() : "unverified");
                response.put("location", buddyProfile.getLocation());
            } else {
                response.put("verificationStatus", "unverified");
                response.put("location", "Not Specified");
            }
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/avatar", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadAvatar(Principal principal, @RequestParam("file") MultipartFile file) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String email = principal.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        String avatarUrl = cloudinaryService.uploadImage(file, "local-buddy/users/" + user.getId() + "/avatar");
        user.setAvatarUrl(avatarUrl);
        user.setUpdatedAt(java.time.OffsetDateTime.now());
        User savedUser = userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("id", savedUser.getId());
        response.put("email", savedUser.getEmail());
        response.put("fullName", savedUser.getFullName());
        response.put("avatarUrl", avatarUrl);
        response.put("displayAvatarUrl", AvatarService.getDisplayAvatarUrl(savedUser));
        response.put("googleAvatarUrl", savedUser.getGoogleAvatarUrl());
        response.put("role", savedUser.getRole().name());
        response.put("phone", savedUser.getPhone());
        return ResponseEntity.ok(response);
    }
}
