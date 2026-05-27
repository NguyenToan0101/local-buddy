package localbuddy.backend.service;

import localbuddy.backend.dto.AuthResponse;
import localbuddy.backend.dto.RegisterRequest;
import localbuddy.backend.model.entity.BuddyProfile;
import localbuddy.backend.model.entity.TouristProfile;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.model.enums.UserRole;
import localbuddy.backend.model.enums.VerificationStatus;
import localbuddy.backend.repository.BuddyProfileRepository;
import localbuddy.backend.repository.TouristProfileRepository;
import localbuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final TouristProfileRepository touristProfileRepository;
    private final BuddyProfileRepository buddyProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final EmailService emailService;

    @Transactional
    public AuthResponse register(RegisterRequest registerRequest) {
        String email = registerRequest.getEmail().trim().toLowerCase();

        // 1. Check if email already exists
        Optional<User> existingUserOpt = userRepository.findByEmail(email);
        User user;
        UserRole userRole;
        try {
            userRole = UserRole.valueOf(registerRequest.getRole().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid role specified: " + registerRequest.getRole());
        }

        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            if (Boolean.TRUE.equals(existingUser.getIsActive())) {
                throw new IllegalArgumentException("Email already exists!");
            }
            // Update the existing inactive user
            user = existingUser;
            user.setPasswordHash(passwordEncoder.encode(registerRequest.getPassword()));
            user.setFullName(registerRequest.getName());
            user.setRole(userRole);
            user.setIsBuddy(userRole == UserRole.BUDDY);
            user.setUpdatedAt(OffsetDateTime.now());
        } else {
            // Create a new inactive User entity
            user = new User();
            user.setEmail(email);
            user.setPasswordHash(passwordEncoder.encode(registerRequest.getPassword()));
            user.setFullName(registerRequest.getName());
            user.setRole(userRole);
            user.setIsBuddy(userRole == UserRole.BUDDY);
            user.setIsActive(false); // Inactive initially
            user.setCreatedAt(OffsetDateTime.now());
            user.setUpdatedAt(OffsetDateTime.now());
        }

        User savedUser = userRepository.save(user);

        // 4. Create appropriate profile (clean existing ones if any, due to prior failed register attempts)
        if (userRole == UserRole.TRAVELER) {
            if (savedUser.getId() != null) {
                touristProfileRepository.findAll().stream()
                        .filter(p -> p.getUser().getId().equals(savedUser.getId()))
                        .forEach(touristProfileRepository::delete);
            }
            TouristProfile touristProfile = new TouristProfile();
            touristProfile.setUser(savedUser);
            touristProfile.setLanguages(new ArrayList<>());
            touristProfile.setInterests(new ArrayList<>());
            touristProfile.setCreatedAt(OffsetDateTime.now());
            touristProfile.setUpdatedAt(OffsetDateTime.now());
            touristProfileRepository.save(touristProfile);
        } else if (userRole == UserRole.BUDDY) {
            if (savedUser.getId() != null) {
                buddyProfileRepository.findAll().stream()
                        .filter(p -> p.getUser().getId().equals(savedUser.getId()))
                        .forEach(buddyProfileRepository::delete);
            }
            BuddyProfile buddyProfile = new BuddyProfile();
            buddyProfile.setUser(savedUser);
            buddyProfile.setLocation("Not Specified");
            buddyProfile.setHourlyRate(BigDecimal.ZERO);
            buddyProfile.setRating(new BigDecimal("5.0"));
            buddyProfile.setReviewCount(0);
            buddyProfile.setVerificationStatus(VerificationStatus.PENDING);
            buddyProfile.setLanguages(new ArrayList<>());
            buddyProfile.setTags(new ArrayList<>());
            buddyProfile.setInterests(new ArrayList<>());
            buddyProfile.setCreatedAt(OffsetDateTime.now());
            buddyProfile.setUpdatedAt(OffsetDateTime.now());
            buddyProfileRepository.save(buddyProfile);
        }

        // Generate and send OTP asynchronously to prevent API blocking/delay
        String otp = otpService.generateOtp(email);
        java.util.concurrent.CompletableFuture.runAsync(() -> emailService.sendOtpEmail(email, otp));

        // Return a response indicating OTP was sent
        return AuthResponse.builder()
                .email(email)
                .role(userRole.name())
                .fullName(savedUser.getFullName())
                .type("OTP_SENT")
                .build();
    }

    @Transactional
    public AuthResponse verifyOtp(String email, String otp) {
        String trimmedEmail = email.trim().toLowerCase();

        // 1. Validate OTP
        if (!otpService.validateOtp(trimmedEmail, otp)) {
            throw new IllegalArgumentException("Invalid or expired OTP!");
        }

        // 2. Load User
        User user = userRepository.findByEmail(trimmedEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found!"));

        // 3. Mark active
        user.setIsActive(true);
        user.setUpdatedAt(OffsetDateTime.now());
        User savedUser = userRepository.save(user);

        // 4. Clear OTP cache
        otpService.clearOtp(trimmedEmail);

        // 5. Generate JWT token
        String jwt = jwtService.generateToken(savedUser.getEmail(), savedUser.getId(), savedUser.getRole().name());

        String verificationStatus = null;
        String location = null;
        if (savedUser.getRole() == UserRole.BUDDY) {
            BuddyProfile buddyProfile = buddyProfileRepository.findByUserId(savedUser.getId()).orElse(null);
            if (buddyProfile != null) {
                verificationStatus = buddyProfile.getVerificationStatus() != null ? buddyProfile.getVerificationStatus().name().toLowerCase() : "unverified";
                location = buddyProfile.getLocation();
            } else {
                verificationStatus = "unverified";
                location = "Not Specified";
            }
        }

        return AuthResponse.builder()
                .token(jwt)
                .id(savedUser.getId())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .avatarUrl(AvatarService.getDisplayAvatarUrl(savedUser))
                .googleAvatarUrl(savedUser.getGoogleAvatarUrl())
                .displayAvatarUrl(AvatarService.getDisplayAvatarUrl(savedUser))
                .role(savedUser.getRole().name())
                .verificationStatus(verificationStatus)
                .location(location)
                .build();
    }
}
