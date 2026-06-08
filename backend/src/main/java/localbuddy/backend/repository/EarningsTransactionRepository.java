package localbuddy.backend.repository;

import localbuddy.backend.model.entity.EarningsTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EarningsTransactionRepository extends JpaRepository<EarningsTransaction, UUID> {
    List<EarningsTransaction> findByBuddyIdOrderByCreatedAtDesc(UUID buddyId);
}
