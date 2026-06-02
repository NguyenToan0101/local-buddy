package localbuddy.backend.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.model.enums.UserRole;
import localbuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.oauth2.redirect-uri-frontend}")
    private String redirectUriFrontend;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        if (email == null) {
            throw new ServletException("Email not found from OAuth2 provider");
        }

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setFullName(name != null ? name : email);
            user.setGoogleAvatarUrl(picture);
            user.setAvatarUrl(picture);
            user.setRole(UserRole.TRAVELER);
            user.setIsBuddy(false);
            user.setIsActive(true);
            // Since password_hash column is not null, we set a random secure encoded value
            user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
            user.setCreatedAt(OffsetDateTime.now());
            user.setUpdatedAt(OffsetDateTime.now());
        } else {
            // Update details from Google
            if (name != null) {
                user.setFullName(name);
            }
            if (picture != null) {
                user.setGoogleAvatarUrl(picture);
                if (user.getAvatarUrl() == null || user.getAvatarUrl().isBlank()) {
                    user.setAvatarUrl(picture);
                }
            }
            user.setUpdatedAt(OffsetDateTime.now());
        }

        user = userRepository.save(user);

        String token = jwtService.generateToken(user.getEmail(), user.getId(), user.getRole().name());

        String targetUrl = UriComponentsBuilder.fromUriString(redirectUriFrontend)
                .queryParam("token", token)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
