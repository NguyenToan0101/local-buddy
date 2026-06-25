package localbuddy.backend.repository;

import localbuddy.backend.model.entity.BuddyProfile;
import localbuddy.backend.model.enums.VerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BuddyProfileRepository extends JpaRepository<BuddyProfile, UUID>, JpaSpecificationExecutor<BuddyProfile> {
    Optional<BuddyProfile> findByUserId(UUID userId);

    List<BuddyProfile> findByVerificationStatusAndUpdatedAtBefore(VerificationStatus status, OffsetDateTime updatedBefore);

    @Override
    @EntityGraph(attributePaths = "user")
    Page<BuddyProfile> findAll(Specification<BuddyProfile> specification, Pageable pageable);
}
