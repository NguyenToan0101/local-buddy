package localbuddy.backend.repository;

import localbuddy.backend.model.entity.ExperienceImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExperienceImageRepository extends JpaRepository<ExperienceImage, UUID> {
    Optional<ExperienceImage> findFirstByExperienceIdOrderByDisplayOrderAscCreatedAtAsc(UUID experienceId);

    void deleteByExperienceId(UUID experienceId);
}
