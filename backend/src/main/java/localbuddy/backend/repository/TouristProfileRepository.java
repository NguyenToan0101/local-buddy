package localbuddy.backend.repository;

import localbuddy.backend.model.entity.TouristProfile;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.model.enums.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TouristProfileRepository extends JpaRepository<TouristProfile, UUID> {
    Optional<TouristProfile> findByUser(User user);
    Optional<TouristProfile> findByUserId(UUID userId);
    boolean existsByUserId(UUID userId);
    List<TouristProfile> findByVerificationStatusAndUpdatedAtBefore(VerificationStatus status, OffsetDateTime updatedBefore);
}
