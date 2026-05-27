package localbuddy.backend.controller;

import localbuddy.backend.dto.AuthResponse;
import localbuddy.backend.dto.LoginRequest;
import localbuddy.backend.dto.RegisterRequest;
import localbuddy.backend.dto.VerifyOtpRequest;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.repository.UserRepository;
import localbuddy.backend.service.AuthService;
import localbuddy.backend.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest registerRequest) {
        return ResponseEntity.ok(authService.register(registerRequest));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(@RequestBody VerifyOtpRequest verifyOtpRequest) {
        return ResponseEntity.ok(authService.verifyOtp(verifyOtpRequest.getEmail(), verifyOtpRequest.getOtp()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest loginRequest) {
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

        AuthResponse authResponse = AuthResponse.builder()
                .token(jwt)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name())
                .build();

        return ResponseEntity.ok(authResponse);
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
        response.put("avatarUrl", user.getAvatarUrl());
        response.put("role", user.getRole().name());
        response.put("isBuddy", user.getIsBuddy());

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
            user.setAvatarUrl((String) updates.get("avatar"));
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
        response.put("avatarUrl", savedUser.getAvatarUrl());
        response.put("role", savedUser.getRole().name());
        response.put("isBuddy", savedUser.getIsBuddy());

        return ResponseEntity.ok(response);
    }
}