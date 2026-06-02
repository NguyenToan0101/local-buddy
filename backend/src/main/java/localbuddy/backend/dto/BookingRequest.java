package localbuddy.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class BookingRequest {
    private UUID buddyId;
    private String title;
    private String activity;
    private String description;
    private String location;
    private String date;
    private String time;
    private Integer hours;
    private String duration;
    private Integer guests;
    private BigDecimal price;
}
