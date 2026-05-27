package localbuddy.backend.repository;

import localbuddy.backend.model.entity.BuddyAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BuddyAvailabilityRepository extends JpaRepository<BuddyAvailability, UUID> {
    List<BuddyAvailability> findByBuddyId(UUID buddyId);
    Optional<BuddyAvailability> findByBuddyIdAndSlotDateAndSlotTime(UUID buddyId, String slotDate, String slotTime);
}
