package localbuddy.backend.repository;

import localbuddy.backend.model.entity.TouristProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TouristProfileRepository extends JpaRepository<TouristProfile, UUID> {
}
