package localbuddy.backend.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
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
    private Integer hours;
    private BigDecimal price;
    private String time;
    private String createdAt;
}
