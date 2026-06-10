package localbuddy.backend.service;

import localbuddy.backend.model.entity.PasswordResetToken;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.repository.PasswordResetTokenRepository;
import localbuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final int TOKEN_BYTES = 32;
    private static final int EXPIRATION_MINUTES = 30;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.password-reset.redirect-uri:http://localhost:5173/reset-password}")
    private String passwordResetRedirectUri;

    @Transactional
    public void requestReset(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        userRepository.findByEmail(normalizedEmail)
                .filter(user -> Boolean.TRUE.equals(user.getIsActive()))
                .ifPresent(this::createAndSendResetToken);
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        String tokenHash = hashToken(rawToken);
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Reset link is invalid or expired."));

        OffsetDateTime now = OffsetDateTime.now();
        if (resetToken.getUsedAt() != null || resetToken.getExpiresAt().isBefore(now)) {
            throw new IllegalArgumentException("Reset link is invalid or expired.");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(now);
        userRepository.save(user);

        resetToken.setUsedAt(now);
        passwordResetTokenRepository.save(resetToken);

        passwordResetTokenRepository.findByUserIdAndUsedAtIsNull(user.getId()).stream()
                .filter(token -> !token.getId().equals(resetToken.getId()))
                .forEach(token -> {
                    token.setUsedAt(now);
                    passwordResetTokenRepository.save(token);
                });
    }

    private void createAndSendResetToken(User user) {
        OffsetDateTime now = OffsetDateTime.now();
        passwordResetTokenRepository.findByUserIdAndUsedAtIsNull(user.getId()).forEach(token -> {
            token.setUsedAt(now);
            passwordResetTokenRepository.save(token);
        });

        String rawToken = generateToken();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setTokenHash(hashToken(rawToken));
        resetToken.setExpiresAt(now.plusMinutes(EXPIRATION_MINUTES));
        resetToken.setCreatedAt(now);
        passwordResetTokenRepository.save(resetToken);

        String resetLink = UriComponentsBuilder.fromUriString(passwordResetRedirectUri)
                .queryParam("token", rawToken)
                .build()
                .toUriString();
        CompletableFuture.runAsync(() -> emailService.sendPasswordResetEmail(user.getEmail(), resetLink));
    }

    private String generateToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Could not hash reset token.", e);
        }
    }
}
