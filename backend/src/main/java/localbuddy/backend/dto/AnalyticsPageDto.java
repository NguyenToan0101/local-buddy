package localbuddy.backend.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class AnalyticsPageDto {
    private String pageUrl;
    private long views;
}
