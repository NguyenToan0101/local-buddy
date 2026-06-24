package localbuddy.backend.controller;

import localbuddy.backend.model.entity.BuddyProfile;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.model.enums.UserRole;
import localbuddy.backend.model.enums.VerificationStatus;
import localbuddy.backend.repository.BookingRepository;
import localbuddy.backend.repository.BuddyProfileRepository;
import localbuddy.backend.repository.TouristProfileRepository;
import localbuddy.backend.repository.UserRepository;
import localbuddy.backend.service.BookingService;
import localbuddy.backend.service.BuddyProfileService;
import localbuddy.backend.service.EarningsService;
import localbuddy.backend.service.JwtService;
import localbuddy.backend.service.TouristProfileService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminController.class)
@Import(AdminControllerTest.MethodSecurityConfig.class)
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private BuddyProfileRepository buddyProfileRepository;

    @MockitoBean
    private TouristProfileRepository touristProfileRepository;

    @MockitoBean
    private BookingRepository bookingRepository;

    @MockitoBean
    private BookingService bookingService;

    @MockitoBean
    private BuddyProfileService buddyProfileService;

    @MockitoBean
    private EarningsService earningsService;

    @MockitoBean
    private TouristProfileService touristProfileService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @Test
    @WithMockUser(roles = "BUDDY")
    void rejectsNonAdminUsers() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard/stats"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void returnsDashboardStatsForAdmins() throws Exception {
        User traveler = user(UUID.randomUUID(), "traveler@example.com", UserRole.TRAVELER);
        User buddy = user(UUID.randomUUID(), "buddy@example.com", UserRole.BUDDY);
        User admin = user(UUID.randomUUID(), "admin@example.com", UserRole.ADMIN);
        BuddyProfile manualReview = profile(buddy, VerificationStatus.MANUAL_REVIEW);
        BuddyProfile approved = profile(buddy, VerificationStatus.MANUAL_APPROVED);
        BuddyProfile rejected = profile(buddy, VerificationStatus.AUTO_REJECTED);

        when(userRepository.findAll()).thenReturn(List.of(traveler, buddy, admin));
        when(buddyProfileRepository.findAll()).thenReturn(List.of(manualReview, approved, rejected));

        mockMvc.perform(get("/api/admin/dashboard/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users").value(3))
                .andExpect(jsonPath("$.travelers").value(1))
                .andExpect(jsonPath("$.buddies").value(1))
                .andExpect(jsonPath("$.pendingVerifications").value(1))
                .andExpect(jsonPath("$.verifiedBuddies").value(1))
                .andExpect(jsonPath("$.rejectedBuddies").value(1));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void excludesAdminUsersFromAdminUserList() throws Exception {
        User traveler = user(UUID.randomUUID(), "traveler@example.com", UserRole.TRAVELER);
        User admin = user(UUID.randomUUID(), "admin@example.com", UserRole.ADMIN);

        when(userRepository.findAll()).thenReturn(List.of(admin, traveler));
        when(touristProfileRepository.findByUserId(traveler.getId())).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].email").value("traveler@example.com"))
                .andExpect(jsonPath("$[0].type").value("Traveller"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updatesBuddyVerification() throws Exception {
        UUID buddyId = UUID.randomUUID();
        User buddy = user(buddyId, "buddy@example.com", UserRole.BUDDY);
        BuddyProfile savedProfile = profile(buddy, VerificationStatus.MANUAL_REJECTED);
        savedProfile.setRejectionReason("Document is unreadable");

        when(buddyProfileService.applyManualVerification(
                eq(buddyId),
                eq("rejected"),
                eq("Document is unreadable")
        )).thenReturn(savedProfile);

        mockMvc.perform(patch("/api/admin/buddies/{userId}/verification", buddyId)
                        .with(csrf())
                        .contentType("application/json")
                        .content("""
                                {
                                  "status": "rejected",
                                  "reason": "Document is unreadable"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(buddyId.toString()))
                .andExpect(jsonPath("$.status").value("Rejected"))
                .andExpect(jsonPath("$.rejectionReason").value("Document is unreadable"));

        verify(buddyProfileService).applyManualVerification(
                eq(buddyId),
                eq("rejected"),
                eq("Document is unreadable")
        );
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void rejectsUnsupportedVerificationStatus() throws Exception {
        mockMvc.perform(patch("/api/admin/buddies/{userId}/verification", UUID.randomUUID())
                        .with(csrf())
                        .contentType("application/json")
                        .content("{\"status\":\"done\"}"))
                .andExpect(status().isBadRequest());
    }

    private User user(UUID id, String email, UserRole role) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setPasswordHash("password");
        user.setFullName(role.name() + " User");
        user.setRole(role);
        user.setIsBuddy(role == UserRole.BUDDY);
        user.setIsActive(true);
        user.setCreatedAt(OffsetDateTime.parse("2026-06-17T10:00:00+07:00"));
        user.setUpdatedAt(OffsetDateTime.parse("2026-06-17T10:00:00+07:00"));
        return user;
    }

    private BuddyProfile profile(User user, VerificationStatus status) {
        BuddyProfile profile = new BuddyProfile();
        profile.setId(UUID.randomUUID());
        profile.setUser(user);
        profile.setAge((short) 25);
        profile.setLocation("Da Nang");
        profile.setVerificationStatus(status);
        profile.setIdCardFrontUrl("https://example.com/front.jpg");
        profile.setIdCardBackUrl("https://example.com/back.jpg");
        profile.setSelfieUrl("https://example.com/selfie.mp4");
        profile.setCreatedAt(OffsetDateTime.parse("2026-06-17T10:00:00+07:00"));
        profile.setUpdatedAt(OffsetDateTime.parse("2026-06-17T10:00:00+07:00"));
        return profile;
    }

    @TestConfiguration
    @EnableMethodSecurity
    static class MethodSecurityConfig {
    }
}
