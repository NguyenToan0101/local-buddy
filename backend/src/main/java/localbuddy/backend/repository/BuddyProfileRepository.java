package localbuddy.backend.repository;

import localbuddy.backend.model.entity.BuddyProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BuddyProfileRepository extends JpaRepository<BuddyProfile, UUID> {
}
