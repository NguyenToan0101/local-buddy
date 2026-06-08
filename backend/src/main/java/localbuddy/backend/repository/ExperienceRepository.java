package localbuddy.backend.repository;

import localbuddy.backend.model.entity.Experience;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExperienceRepository extends JpaRepository<Experience, UUID>, JpaSpecificationExecutor<Experience> {
    List<Experience> findAllByOrderByCreatedAtDesc();

    List<Experience> findByBuddyIdOrderByCreatedAtDesc(UUID buddyId);

    @Override
    @EntityGraph(attributePaths = {"traveler", "buddy"})
    Page<Experience> findAll(Specification<Experience> specification, Pageable pageable);
}
