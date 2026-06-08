package localbuddy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExperienceDto {
    private UUID id;
    private UUID travelerId;
    private String travelerName;
    private String travelerAvatar;
    private UUID buddyId;
    private String buddyName;
    private String title;
    private String storyContent;
    private String location;
    private Short rating;
    private List<String> tags;
    private Boolean pinned;
    private String image;
    private String date;
}
