package localbuddy.backend.repository;

import localbuddy.backend.model.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {
    List<Booking> findByTravelerIdOrBuddyIdOrderByStartTimeDesc(UUID travelerId, UUID buddyId);
}
