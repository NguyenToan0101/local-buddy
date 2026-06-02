package localbuddy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BuddyProfileDto {
    private UUID id;
    private String name;
    private Integer age;
    private String location;
    private BigDecimal rating;
    private Integer reviewCount;
    private List<String> languages;
    private String description;
    private String image;
    private List<String> tags;
    private List<String> interests;
    private BigDecimal price;
    private String phone;
    private String idCardFront;
    private String idCardBack;
    private String verificationStatus;
}
