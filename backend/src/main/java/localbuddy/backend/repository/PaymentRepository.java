package localbuddy.backend.repository;

import localbuddy.backend.model.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findByBookingId(UUID bookingId);
    Optional<Payment> findByTransactionReference(String transactionReference);
    List<Payment> findByPayerId(UUID payerId);
}
