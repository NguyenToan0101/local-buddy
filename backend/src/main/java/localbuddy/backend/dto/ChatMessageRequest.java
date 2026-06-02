package localbuddy.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

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
    private Integer hours;
    private BigDecimal price;
}
