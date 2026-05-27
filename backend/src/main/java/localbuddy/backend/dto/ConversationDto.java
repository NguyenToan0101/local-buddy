package localbuddy.backend.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
public class ConversationDto {
    private UUID id;
    private UUID buddyId;
    private UUID userId;
    private String name;
    private String avatar;
    private String buddyName;
    private String buddyAvatar;
    private String lastMsg;
    private String time;
    private Boolean unread;
    private List<ChatMessageDto> messages;
}
