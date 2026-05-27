package localbuddy.backend.repository;

import localbuddy.backend.model.entity.AvailabilitySlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AvailabilitySlotRepository extends JpaRepository<AvailabilitySlot, UUID> {
    List<AvailabilitySlot> findByBuddyId(UUID buddyId);
    Optional<AvailabilitySlot> findByBuddyIdAndStartTime(UUID buddyId, OffsetDateTime startTime);
}
