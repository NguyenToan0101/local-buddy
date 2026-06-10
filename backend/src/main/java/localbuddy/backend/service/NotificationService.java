package localbuddy.backend.service;

import localbuddy.backend.dto.NotificationDto;
import localbuddy.backend.model.entity.Notification;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.repository.NotificationRepository;
import localbuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final ZoneId NOTIFICATION_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<NotificationDto> getNotifications(UUID currentUserId) {
        return notificationRepository.findByReceiverIdOrderByCreatedAtDesc(currentUserId)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public NotificationDto getNotification(UUID currentUserId, UUID notificationId) {
        return mapToDto(getNotificationForReceiver(currentUserId, notificationId));
    }

    @Transactional
    public NotificationDto createNotification(UUID currentUserId, NotificationDto dto) {
        User receiver = getUser(dto.getReceiverId() != null ? dto.getReceiverId() : currentUserId);
        User sender = dto.getSenderId() != null ? getUser(dto.getSenderId()) : getUser(currentUserId);

        Notification notification = new Notification();
        notification.setReceiver(receiver);
        notification.setSender(sender);
        notification.setType(StringUtils.hasText(dto.getType()) ? dto.getType().trim() : "general");
        notification.setTitle(requiredText(dto.getTitle(), "Notification title is required."));
        notification.setContent(requiredText(firstText(dto.getContent(), dto.getDesc()), "Notification content is required."));
        notification.setIsRead(false);
        notification.setCreatedAt(nowInNotificationZone());
        return mapToDto(notificationRepository.save(notification));
    }

    @Transactional
    public NotificationDto markAsRead(UUID currentUserId, UUID notificationId) {
        Notification notification = getNotificationForReceiver(currentUserId, notificationId);
        notification.setIsRead(true);
        return mapToDto(notificationRepository.save(notification));
    }

    @Transactional
    public void deleteNotification(UUID currentUserId, UUID notificationId) {
        Notification notification = getNotificationForReceiver(currentUserId, notificationId);
        notificationRepository.delete(notification);
    }

    private NotificationDto mapToDto(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .receiverId(notification.getReceiver().getId())
                .senderId(notification.getSender() != null ? notification.getSender().getId() : null)
                .senderName(notification.getSender() != null ? notification.getSender().getFullName() : null)
                .type(notification.getType())
                .title(notification.getTitle())
                .content(notification.getContent())
                .desc(notification.getContent())
                .unread(!Boolean.TRUE.equals(notification.getIsRead()))
                .time(formatRelativeTime(notification.getCreatedAt()))
                .build();
    }

    private Notification getNotificationForReceiver(UUID currentUserId, UUID notificationId) {
        return notificationRepository.findByIdAndReceiverId(notificationId, currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found."));
    }

    private User getUser(UUID userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID is required.");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
    }

    private String requiredText(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private String firstText(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return null;
    }

    private String formatRelativeTime(OffsetDateTime createdAt) {
        if (createdAt == null) {
            return "";
        }

        Duration duration = Duration.between(createdAt, nowInNotificationZone()).abs();
        long minutes = duration.toMinutes();
        if (minutes < 1) {
            return "now";
        }
        if (minutes < 60) {
            return minutes + "m";
        }
        long hours = duration.toHours();
        if (hours < 24) {
            return hours + "h";
        }
        return duration.toDays() + "d";
    }

    private OffsetDateTime nowInNotificationZone() {
        return OffsetDateTime.now(NOTIFICATION_ZONE);
    }
}
