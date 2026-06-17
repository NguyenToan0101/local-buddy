package localbuddy.backend.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
public class ChatMessageDto {
    private UUID id;
    private UUID conversationId;
    private UUID senderId;
    private String senderRole;
    private String type;
    private String text;
    private Boolean isOffer;
    private UUID bookingId;
    private String bookingStatus;
    private String description;
    private String date;
    private String offerTime;
    private String duration;
    private Integer guests;
    private String bookingType;
    private String meetingPoint;
    private List<String> routeStops;
    private String itineraryNotes;
    private Integer hours;
    private BigDecimal price;
    private String time;
    private String createdAt;
}
