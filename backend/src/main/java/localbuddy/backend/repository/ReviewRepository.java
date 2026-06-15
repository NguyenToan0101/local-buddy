package localbuddy.backend.repository;

import localbuddy.backend.model.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    boolean existsByBookingIdAndReviewerId(UUID bookingId, UUID reviewerId);
}
