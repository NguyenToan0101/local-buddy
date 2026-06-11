package localbuddy.backend.service;

import localbuddy.backend.dto.AuthResponse;
import localbuddy.backend.dto.RegisterRequest;
import localbuddy.backend.model.entity.BuddyProfile;
import localbuddy.backend.model.entity.PendingRegistration;
import localbuddy.backend.model.entity.TouristProfile;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.model.enums.UserRole;
import localbuddy.backend.model.enums.VerificationStatus;
import localbuddy.backend.repository.BuddyProfileRepository;
import localbuddy.backend.repository.PendingRegistrationRepository;
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
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final int OTP_EXPIRATION_MINUTES = 5;
    private static final int MAX_OTP_ATTEMPTS = 5;
    private static final int MAX_OTP_RESENDS = 3;

    private final UserRepository userRepository;
    private final TouristProfileRepository touristProfileRepository;
    private final BuddyProfileRepository buddyProfileRepository;
    private final PendingRegistrationRepository pendingRegistrationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final Random random = new Random();

    @Transactional
    public AuthResponse register(RegisterRequest registerRequest) {
        String email = registerRequest.getEmail().trim().toLowerCase();
        String fullName = registerRequest.getName().trim();
        UserRole userRole = parseRole(registerRequest.getRole());

        Optional<User> existingUserOpt = userRepository.findByEmailIgnoreCase(email);
        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            if (Boolean.TRUE.equals(existingUser.getIsActive())) {
                throw new IllegalArgumentException("Email already exists!");
            }
            deleteLegacyInactiveUser(existingUser);
        }

        String otp = generateOtp();
        PendingRegistration pendingRegistration = pendingRegistrationRepository
                .findByEmailIgnoreCase(email)
                .orElseGet(PendingRegistration::new);
        OffsetDateTime now = OffsetDateTime.now();
        if (pendingRegistration.getCreatedAt() == null) {
            pendingRegistration.setCreatedAt(now);
        }
        pendingRegistration.setEmail(email);
        pendingRegistration.setFullName(fullName);
        pendingRegistration.setPasswordHash(passwordEncoder.encode(registerRequest.getPassword()));
        pendingRegistration.setRole(userRole);
        pendingRegistration.setOtpHash(passwordEncoder.encode(otp));
        pendingRegistration.setAttemptCount(0);
        pendingRegistration.setResendCount(0);
        pendingRegistration.setExpiresAt(now.plusMinutes(OTP_EXPIRATION_MINUTES));
        pendingRegistration.setUpdatedAt(now);
        PendingRegistration savedPending = pendingRegistrationRepository.saveAndFlush(pendingRegistration);

        emailService.sendOtpEmail(email, otp);

        return AuthResponse.builder()
                .email(email)
                .role(userRole.name())
                .fullName(savedPending.getFullName())
                .type("OTP_SENT")
                .build();
    }

    @Transactional
    public AuthResponse resendOtp(String email) {
        String trimmedEmail = email.trim().toLowerCase();
        User activeUser = userRepository.findByEmailIgnoreCase(trimmedEmail).orElse(null);
        if (activeUser != null && Boolean.TRUE.equals(activeUser.getIsActive())) {
            throw new IllegalArgumentException("Email is already verified. Please sign in.");
        }

        PendingRegistration pendingRegistration = pendingRegistrationRepository.findByEmailIgnoreCase(trimmedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Registration session not found. Please register again."));

        int resendCount = pendingRegistration.getResendCount() == null ? 0 : pendingRegistration.getResendCount();
        if (resendCount >= MAX_OTP_RESENDS) {
            throw new IllegalArgumentException("You have reached the OTP resend limit. Please register again.");
        }

        String otp = generateOtp();
        pendingRegistration.setOtpHash(passwordEncoder.encode(otp));
        pendingRegistration.setAttemptCount(0);
        pendingRegistration.setResendCount(resendCount + 1);
        pendingRegistration.setExpiresAt(OffsetDateTime.now().plusMinutes(OTP_EXPIRATION_MINUTES));
        pendingRegistration.setUpdatedAt(OffsetDateTime.now());
        PendingRegistration savedPending = pendingRegistrationRepository.saveAndFlush(pendingRegistration);

        emailService.sendOtpEmail(trimmedEmail, otp);

        return AuthResponse.builder()
                .email(trimmedEmail)
                .role(savedPending.getRole().name())
                .fullName(savedPending.getFullName())
                .type("OTP_SENT")
                .build();
    }

    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public AuthResponse verifyOtp(String email, String otp) {
        String trimmedEmail = email.trim().toLowerCase();
        PendingRegistration pendingRegistration = pendingRegistrationRepository.findByEmailIgnoreCase(trimmedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Registration session not found or expired. Please register again."));

        OffsetDateTime now = OffsetDateTime.now();
        if (pendingRegistration.getExpiresAt().isBefore(now)) {
            pendingRegistrationRepository.delete(pendingRegistration);
            throw new IllegalArgumentException("OTP has expired. Please register again.");
        }

        if (pendingRegistration.getAttemptCount() != null && pendingRegistration.getAttemptCount() >= MAX_OTP_ATTEMPTS) {
            pendingRegistrationRepository.delete(pendingRegistration);
            throw new IllegalArgumentException("Too many invalid OTP attempts. Please register again.");
        }

        if (!passwordEncoder.matches(otp.trim(), pendingRegistration.getOtpHash())) {
            int newAttemptCount = (pendingRegistration.getAttemptCount() == null ? 0 : pendingRegistration.getAttemptCount()) + 1;
            if (newAttemptCount >= MAX_OTP_ATTEMPTS) {
                pendingRegistrationRepository.delete(pendingRegistration);
                throw new IllegalArgumentException("Too many invalid OTP attempts. Please register again.");
            }
            pendingRegistration.setAttemptCount(newAttemptCount);
            pendingRegistration.setUpdatedAt(now);
            pendingRegistrationRepository.save(pendingRegistration);
            throw new IllegalArgumentException("Invalid or expired OTP!");
        }

        Optional<User> existingUserOpt = userRepository.findByEmailIgnoreCase(trimmedEmail);
        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            if (Boolean.TRUE.equals(existingUser.getIsActive())) {
                pendingRegistrationRepository.delete(pendingRegistration);
                throw new IllegalArgumentException("Email is already verified. Please sign in.");
            }
            deleteLegacyInactiveUser(existingUser);
        }

        User user = new User();
        user.setEmail(pendingRegistration.getEmail());
        user.setPasswordHash(pendingRegistration.getPasswordHash());
        user.setFullName(pendingRegistration.getFullName());
        user.setRole(pendingRegistration.getRole());
        user.setIsBuddy(pendingRegistration.getRole() == UserRole.BUDDY);
        user.setIsActive(true);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        User savedUser = userRepository.save(user);
        ensureProfileForRole(savedUser, pendingRegistration.getRole());

        pendingRegistrationRepository.delete(pendingRegistration);

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

    private UserRole parseRole(String role) {
        try {
            return UserRole.valueOf(role.toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid role specified: " + role);
        }
    }

    private String generateOtp() {
        int number = 100000 + random.nextInt(900000);
        return String.valueOf(number);
    }

    private void deleteLegacyInactiveUser(User user) {
        buddyProfileRepository.findByUserId(user.getId()).ifPresent(buddyProfileRepository::delete);
        touristProfileRepository.findByUserId(user.getId()).ifPresent(touristProfileRepository::delete);
        userRepository.delete(user);
        userRepository.flush();
    }

    private void ensureProfileForRole(User user, UserRole userRole) {
        if (userRole == UserRole.TRAVELER) {
            buddyProfileRepository.findByUserId(user.getId()).ifPresent(buddyProfileRepository::delete);
            if (touristProfileRepository.existsByUserId(user.getId())) {
                return;
            }

            TouristProfile touristProfile = new TouristProfile();
            touristProfile.setUser(user);
            touristProfile.setLanguages(new ArrayList<>());
            touristProfile.setInterests(new ArrayList<>());
            touristProfile.setCreatedAt(OffsetDateTime.now());
            touristProfile.setUpdatedAt(OffsetDateTime.now());
            touristProfileRepository.save(touristProfile);
            return;
        }

        if (userRole == UserRole.BUDDY) {
            touristProfileRepository.findByUserId(user.getId()).ifPresent(touristProfileRepository::delete);
            if (buddyProfileRepository.findByUserId(user.getId()).isPresent()) {
                return;
            }

            BuddyProfile buddyProfile = new BuddyProfile();
            buddyProfile.setUser(user);
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
    }
}
