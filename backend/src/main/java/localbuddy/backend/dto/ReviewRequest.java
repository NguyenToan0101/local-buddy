package localbuddy.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewRequest {
    private Short rating;
    private String comment;
    private Boolean isPublic;
}
