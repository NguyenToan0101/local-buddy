package localbuddy.backend.repository;

import localbuddy.backend.model.entity.Booking;
import localbuddy.backend.model.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {
    Page<Booking> findByTravelerIdOrBuddyIdOrderByStartTimeDesc(UUID travelerId, UUID buddyId, Pageable pageable);

    List<Booking> findByStatusAndStartTimeBefore(BookingStatus status, OffsetDateTime startTime);
}
