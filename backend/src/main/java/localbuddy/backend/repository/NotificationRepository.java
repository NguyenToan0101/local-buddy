package localbuddy.backend.repository;

import localbuddy.backend.model.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByReceiverIdOrderByCreatedAtDesc(UUID receiverId);

    Optional<Notification> findByIdAndReceiverId(UUID id, UUID receiverId);

    boolean existsByReceiverIdAndTypeAndBookingId(UUID receiverId, String type, UUID bookingId);
}
