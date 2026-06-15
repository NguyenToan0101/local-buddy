package localbuddy.backend.repository;

import localbuddy.backend.model.entity.PayoutRequest;
import localbuddy.backend.model.enums.PayoutStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PayoutRequestRepository extends JpaRepository<PayoutRequest, UUID> {
    List<PayoutRequest> findAllByOrderByRequestedAtDesc();
    List<PayoutRequest> findByBuddyIdOrderByRequestedAtDesc(UUID buddyId);
    List<PayoutRequest> findByStatusOrderByRequestedAtDesc(PayoutStatus status);
}
