package localbuddy.backend.config;

import localbuddy.backend.model.entity.User;
import localbuddy.backend.model.enums.UserRole;
import localbuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminUserInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        createAdminUserIfNotExists();
    }

    private void createAdminUserIfNotExists() {
        String adminEmail = "admin@gmail.com";

        // Check if admin user already exists
        if (userRepository.findByEmail(adminEmail).isPresent()) {
            log.info("Admin user already exists with email: {}", adminEmail);
            return;
        }

        // Create admin user
        User admin = new User();
        admin.setEmail(adminEmail);
        admin.setPasswordHash(passwordEncoder.encode("admin")); // Hardcoded password
        admin.setFullName("System Administrator");
        admin.setPhone("+84 123 456 789");
        admin.setRole(UserRole.ADMIN);
        admin.setIsBuddy(false);
        admin.setIsActive(true);
        admin.setCreatedAt(OffsetDateTime.now());
        admin.setUpdatedAt(OffsetDateTime.now());

        userRepository.save(admin);

        log.info("===========================================");
        log.info("Admin user created successfully!");
        log.info("Email: {}", adminEmail);
        log.info("Password: admin");
        log.info("===========================================");
    }
}
