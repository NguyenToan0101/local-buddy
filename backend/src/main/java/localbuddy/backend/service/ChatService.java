package localbuddy.backend.service;

import localbuddy.backend.dto.BookingRequest;
import localbuddy.backend.dto.ChatMessageDto;
import localbuddy.backend.dto.ChatMessageRequest;
import localbuddy.backend.dto.ConversationDto;
import localbuddy.backend.model.entity.Booking;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final ZoneId CHAT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ChatWebSocketHandler chatWebSocketHandler;
    private final BookingService bookingService;

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
                    OffsetDateTime now = nowInChatZone();
                    created.setCreatedAt(now);
                    created.setUpdatedAt(now);
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

        Booking offerBooking = null;
        if (Boolean.TRUE.equals(request.getIsOffer())) {
            offerBooking = createBookingFromOffer(currentUser, conversation, request);
        }

        Message message = new Message();
        message.setConversation(conversation);
        message.setSender(currentUser);
        message.setContent(content.trim());
        message.setIsOffer(Boolean.TRUE.equals(request.getIsOffer()));
        message.setOfferedHours(offerBooking != null ? offerBooking.getTotalHours() : request.getHours());
        message.setOfferedPrice(offerBooking != null ? offerBooking.getTotalPrice() : request.getPrice());
        message.setBooking(offerBooking);
        message.setIsRead(false);
        message.setCreatedAt(nowInChatZone());
        Message savedMessage = messageRepository.save(message);

        conversation.setLastMessage(savedMessage);
        conversation.setLastMessageAt(savedMessage.getCreatedAt());
        conversation.setUpdatedAt(savedMessage.getCreatedAt());
        Conversation savedConversation = conversationRepository.save(conversation);

        notifyUser(savedConversation.getTraveler().getId());
        notifyUser(savedConversation.getBuddy().getId());

        return mapConversation(savedConversation, currentUser, true);
    }

    private Booking createBookingFromOffer(User currentUser, Conversation conversation, ChatMessageRequest request) {
        if (currentUser.getRole() != UserRole.BUDDY || !conversation.getBuddy().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Only the buddy in this conversation can create an offer.");
        }

        BookingRequest bookingRequest = new BookingRequest();
        bookingRequest.setTitle(firstText(request.getText(), "Custom Offer"));
        bookingRequest.setDescription(firstText(request.getItineraryNotes(), request.getDescription()));
        bookingRequest.setBookingType(firstText(request.getBookingType(), "CONSULTATION"));
        bookingRequest.setMeetingPoint(request.getMeetingPoint());
        bookingRequest.setRouteStops(request.getRouteStops());
        bookingRequest.setItineraryNotes(request.getItineraryNotes());
        bookingRequest.setDate(StringUtils.hasText(request.getDate()) ? LocalDate.parse(request.getDate()) : null);
        bookingRequest.setTime(request.getTime());
        bookingRequest.setDuration(request.getDuration());
        bookingRequest.setHours(request.getHours());
        bookingRequest.setGuests(request.getGuests());
        bookingRequest.setPrice(request.getPrice());
        return bookingService.createPendingBooking(conversation.getTraveler(), conversation.getBuddy(), bookingRequest);
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
        Booking booking = message.getBooking();
        OffsetDateTime bookingStart = booking != null && booking.getStartTime() != null
                ? booking.getStartTime().atZoneSameInstant(CHAT_ZONE).toOffsetDateTime()
                : null;
        Integer hours = booking != null ? booking.getTotalHours() : message.getOfferedHours();
        BigDecimal price = booking != null ? booking.getTotalPrice() : message.getOfferedPrice();

        return ChatMessageDto.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .senderId(message.getSender().getId())
                .senderRole(message.getSender().getRole().name())
                .type(sentByCurrentUser ? "sent" : "received")
                .text(message.getContent())
                .isOffer(Boolean.TRUE.equals(message.getIsOffer()))
                .bookingId(booking != null ? booking.getId() : null)
                .bookingStatus(booking != null && booking.getStatus() != null ? booking.getStatus().name() : null)
                .description(booking != null ? booking.getDescription() : null)
                .date(bookingStart != null ? bookingStart.toLocalDate().toString() : null)
                .offerTime(bookingStart != null ? bookingStart.toLocalTime().format(TIME_FORMATTER) : null)
                .duration(hours != null ? hours + " hours" : null)
                .guests(booking != null ? booking.getGuestCount() : null)
                .bookingType(booking != null ? booking.getBookingType() : null)
                .meetingPoint(booking != null ? booking.getMeetingPoint() : null)
                .routeStops(booking != null ? bookingService.mapToDto(booking).getRouteStops() : null)
                .itineraryNotes(booking != null ? booking.getItineraryNotes() : null)
                .hours(hours)
                .price(price)
                .time(formatTime(message.getCreatedAt()))
                .createdAt(message.getCreatedAt() != null ? message.getCreatedAt().toString() : null)
                .build();
    }

    private String formatTime(OffsetDateTime dateTime) {
        return dateTime != null ? dateTime.atZoneSameInstant(CHAT_ZONE).format(TIME_FORMATTER) : "";
    }

    private OffsetDateTime nowInChatZone() {
        return OffsetDateTime.now(CHAT_ZONE);
    }

    private String firstText(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }
        return "";
    }

    private String firstRouteStop(List<String> routeStops) {
        if (routeStops == null) {
            return null;
        }
        return routeStops.stream()
                .filter(StringUtils::hasText)
                .findFirst()
                .orElse(null);
    }
}
