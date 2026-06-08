package localbuddy.backend.repository;

import localbuddy.backend.model.entity.Experience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExperienceRepository extends JpaRepository<Experience, UUID> {
    List<Experience> findAllByOrderByCreatedAtDesc();

    List<Experience> findByBuddyIdOrderByCreatedAtDesc(UUID buddyId);
}
