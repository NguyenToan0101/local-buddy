package localbuddy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private UUID id;
    private String email;
    private String name;
    private String fullName;
    private String role;
    private String avatar;
    private String avatarUrl;
    private String googleAvatarUrl;
    private String displayAvatarUrl;
    private String phone;
    private String location;
    private String verificationStatus;
}
