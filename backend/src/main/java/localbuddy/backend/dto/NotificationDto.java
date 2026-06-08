package localbuddy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private UUID id;
    private UUID receiverId;
    private UUID senderId;
    private String senderName;
    private String type;
    private String title;
    private String content;
    private String desc;
    private Boolean unread;
    private String time;
}
