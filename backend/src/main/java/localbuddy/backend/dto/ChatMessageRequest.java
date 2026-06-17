package localbuddy.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class ChatMessageRequest {
    private String text;
    private String content;
    private Boolean isOffer;
    private String activity;
    private String description;
    private String date;
    private String time;
    private String duration;
    private Integer guests;
    private String location;
    private String bookingType;
    private String meetingPoint;
    private List<String> routeStops;
    private String itineraryNotes;
    private Integer hours;
    private BigDecimal price;
}
