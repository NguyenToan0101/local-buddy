package localbuddy.backend.repository;

import localbuddy.backend.model.entity.BuddyProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BuddyProfileRepository extends JpaRepository<BuddyProfile, UUID>, JpaSpecificationExecutor<BuddyProfile> {
    Optional<BuddyProfile> findByUserId(UUID userId);

    Optional<BuddyProfile> findFirstByExtractedIdNumberAndUser_IdNot(String extractedIdNumber, UUID userId);

    @Override
    @EntityGraph(attributePaths = "user")
    Page<BuddyProfile> findAll(Specification<BuddyProfile> specification, Pageable pageable);
}
