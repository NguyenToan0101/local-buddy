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
public class BookingDto {
    private UUID id;
    private UUID userId;
    private UUID buddyId;
    private String traveler;
    private String travelerAvatar;
    private String buddyName;
    private String buddyAvatar;
    private String title;
    private String description;
    private String bookingType;
    private String meetingPoint;
    private List<String> routeStops;
    private String itineraryNotes;
    private String date;
    private String time;
    private Integer hours;
    private Integer guests;
    private BigDecimal price;
    private BigDecimal totalPrice;
    private String status;
    private String meetupStatus;
}
