package localbuddy.backend.repository;

import localbuddy.backend.model.entity.Cancellation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CancellationRepository extends JpaRepository<Cancellation, UUID> {
    Optional<Cancellation> findByBookingId(UUID bookingId);
}
