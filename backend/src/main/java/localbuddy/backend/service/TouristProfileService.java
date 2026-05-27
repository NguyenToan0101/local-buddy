package localbuddy.backend.service;

import localbuddy.backend.dto.TouristProfileRequest;
import localbuddy.backend.dto.TouristProfileResponse;
import localbuddy.backend.model.entity.TouristProfile;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.repository.TouristProfileRepository;
import localbuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class TouristProfileService {

    private final TouristProfileRepository touristProfileRepository;
    private final UserRepository userRepository;

    public TouristProfileResponse createProfile(UUID userId, TouristProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if profile already exists
        if (touristProfileRepository.existsByUserId(userId)) {
            throw new RuntimeException("Tourist profile already exists for this user");
        }

        TouristProfile profile = new TouristProfile();
        profile.setUser(user);
        profile.setNationality(request.getNationality());
        profile.setBio(request.getBio());
        profile.setLanguages(request.getLanguages());
        profile.setInterests(request.getInterests());

        TouristProfile savedProfile = touristProfileRepository.save(profile);
        
        return mapToResponse(savedProfile);
    }

    public TouristProfileResponse updateProfile(UUID userId, TouristProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TouristProfile profile = touristProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Tourist profile not found"));

        // Update profile fields
        if (request.getNationality() != null) {
            profile.setNationality(request.getNationality());
        }
        if (request.getBio() != null) {
            profile.setBio(request.getBio());
        }
        if (request.getLanguages() != null) {
            profile.setLanguages(request.getLanguages());
        }
        if (request.getInterests() != null) {
            profile.setInterests(request.getInterests());
        }

        TouristProfile savedProfile = touristProfileRepository.save(profile);
        return mapToResponse(savedProfile);
    }

    @Transactional(readOnly = true)
    public TouristProfileResponse getProfile(UUID userId) {
        TouristProfile profile = touristProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Tourist profile not found"));
        return mapToResponse(profile);
    }

    @Transactional(readOnly = true)
    public boolean hasProfile(UUID userId) {
        return touristProfileRepository.existsByUserId(userId);
    }

    public void deleteProfile(UUID userId) {
        TouristProfile profile = touristProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Tourist profile not found"));
        touristProfileRepository.delete(profile);
    }

    private TouristProfileResponse mapToResponse(TouristProfile profile) {
        User user = profile.getUser();
        return TouristProfileResponse.builder()
                .id(profile.getId())
                .userId(user.getId())
                .nationality(profile.getNationality())
                .bio(profile.getBio())
                .languages(profile.getLanguages())
                .interests(profile.getInterests())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl()) // Get from User entity
                .build();
    }
}