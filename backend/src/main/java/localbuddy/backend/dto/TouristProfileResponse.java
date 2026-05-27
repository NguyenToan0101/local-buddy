package localbuddy.backend.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TouristProfileResponse {
    private UUID id;
    private UUID userId;
    private String nationality;
    private String bio;
    private List<String> languages;
    private List<String> interests;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    
    // User basic info
    private String fullName;
    private String email;
    private String phone;
    private String avatarUrl; // From User entity
}