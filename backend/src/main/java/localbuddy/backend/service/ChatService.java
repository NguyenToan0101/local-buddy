package localbuddy.backend.service;

import localbuddy.backend.dto.ChatMessageDto;
import localbuddy.backend.dto.ChatMessageRequest;
import localbuddy.backend.dto.ConversationDto;
import localbuddy.backend.model.entity.Conversation;
import localbuddy.backend.model.entity.Message;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.model.enums.UserRole;
import localbuddy.backend.repository.ConversationRepository;
import localbuddy.backend.repository.MessageRepository;
import localbuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ChatWebSocketHandler chatWebSocketHandler;

    @Transactional(readOnly = true)
    public List<ConversationDto> getConversations(UUID userId) {
        User currentUser = getUser(userId);
        return conversationRepository.findByTravelerIdOrBuddyIdOrderByLastMessageAtDesc(userId, userId)
                .stream()
                .map(conversation -> mapConversation(conversation, currentUser, true))
                .toList();
    }

    @Transactional
    public ConversationDto getOrCreateConversationWithBuddy(UUID currentUserId, UUID buddyId) {
        User currentUser = getUser(currentUserId);
        User buddy = getUser(buddyId);

        if (currentUser.getId().equals(buddy.getId())) {
            throw new IllegalArgumentException("Cannot create a conversation with yourself.");
        }
        if (buddy.getRole() != UserRole.BUDDY) {
            throw new IllegalArgumentException("Target user is not a buddy.");
        }

        Conversation conversation = conversationRepository
                .findByTravelerIdAndBuddyId(currentUser.getId(), buddy.getId())
                .orElseGet(() -> {
                    Conversation created = new Conversation();
                    created.setTraveler(currentUser);
                    created.setBuddy(buddy);
                    created.setCreatedAt(OffsetDateTime.now());
                    created.setUpdatedAt(OffsetDateTime.now());
                    return conversationRepository.save(created);
                });

        notifyUser(buddy.getId());
        return mapConversation(conversation, currentUser, true);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getMessages(UUID currentUserId, UUID conversationId) {
        User currentUser = getUser(currentUserId);
        Conversation conversation = getConversationForParticipant(conversationId, currentUser);

        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId())
                .stream()
                .map(message -> mapMessage(message, currentUser))
                .toList();
    }

    @Transactional
    public ConversationDto sendMessage(UUID currentUserId, UUID conversationId, ChatMessageRequest request) {
        User currentUser = getUser(currentUserId);
        Conversation conversation = getConversationForParticipant(conversationId, currentUser);

        String content = StringUtils.hasText(request.getText()) ? request.getText().trim() : request.getContent();
        if (!StringUtils.hasText(content)) {
            throw new IllegalArgumentException("Message content is required.");
        }

        Message message = new Message();
        message.setConversation(conversation);
        message.setSender(currentUser);
        message.setContent(content.trim());
        message.setIsOffer(Boolean.TRUE.equals(request.getIsOffer()));
        message.setOfferedHours(request.getHours());
        message.setOfferedPrice(request.getPrice());
        message.setIsRead(false);
        message.setCreatedAt(OffsetDateTime.now());
        Message savedMessage = messageRepository.save(message);

        conversation.setLastMessage(savedMessage);
        conversation.setLastMessageAt(savedMessage.getCreatedAt());
        conversation.setUpdatedAt(savedMessage.getCreatedAt());
        Conversation savedConversation = conversationRepository.save(conversation);

        notifyUser(savedConversation.getTraveler().getId());
        notifyUser(savedConversation.getBuddy().getId());

        return mapConversation(savedConversation, currentUser, true);
    }

    private void notifyUser(UUID userId) {
        chatWebSocketHandler.notifyMessagesChanged(userId);
    }

    private User getUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
    }

    private Conversation getConversationForParticipant(UUID conversationId, User currentUser) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found."));

        boolean participant = conversation.getTraveler().getId().equals(currentUser.getId())
                || conversation.getBuddy().getId().equals(currentUser.getId());
        if (!participant) {
            throw new IllegalArgumentException("You are not allowed to access this conversation.");
        }
        return conversation;
    }

    private ConversationDto mapConversation(Conversation conversation, User currentUser, boolean includeMessages) {
        User traveler = conversation.getTraveler();
        User buddy = conversation.getBuddy();
        User counterpart = currentUser.getId().equals(buddy.getId()) ? traveler : buddy;
        Message lastMessage = conversation.getLastMessage();
        List<ChatMessageDto> messages = includeMessages
                ? messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId())
                .stream()
                .map(message -> mapMessage(message, currentUser))
                .toList()
                : List.of();

        return ConversationDto.builder()
                .id(conversation.getId())
                .buddyId(buddy.getId())
                .userId(traveler.getId())
                .name(counterpart.getFullName())
                .avatar(AvatarService.getDisplayAvatarUrl(counterpart))
                .buddyName(buddy.getFullName())
                .buddyAvatar(AvatarService.getDisplayAvatarUrl(buddy))
                .lastMsg(lastMessage != null ? lastMessage.getContent() : "Start a conversation")
                .time(formatTime(conversation.getLastMessageAt() != null ? conversation.getLastMessageAt() : conversation.getUpdatedAt()))
                .unread(false)
                .messages(messages)
                .build();
    }

    private ChatMessageDto mapMessage(Message message, User currentUser) {
        boolean sentByCurrentUser = message.getSender().getId().equals(currentUser.getId());

        return ChatMessageDto.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .senderId(message.getSender().getId())
                .senderRole(message.getSender().getRole().name())
                .type(sentByCurrentUser ? "sent" : "received")
                .text(message.getContent())
                .isOffer(Boolean.TRUE.equals(message.getIsOffer()))
                .hours(message.getOfferedHours())
                .price(message.getOfferedPrice())
                .time(formatTime(message.getCreatedAt()))
                .createdAt(message.getCreatedAt() != null ? message.getCreatedAt().toString() : null)
                .build();
    }

    private String formatTime(OffsetDateTime dateTime) {
        return dateTime != null ? dateTime.format(TIME_FORMATTER) : "";
    }
}
