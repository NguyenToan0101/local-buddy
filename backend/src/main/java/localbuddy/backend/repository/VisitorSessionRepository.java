package localbuddy.backend.repository;

import localbuddy.backend.model.entity.VisitorSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VisitorSessionRepository extends JpaRepository<VisitorSession, UUID> {
    Optional<VisitorSession> findBySessionKey(String sessionKey);

    @Query("select count(distinct s.user.id) from VisitorSession s where s.user is not null")
    long countDistinctLoggedInUsers();

    @Query("select count(distinct s.sessionKey) from VisitorSession s")
    long countDistinctSessionKeys();

    @Query("select coalesce(s.trafficSource, 'direct'), count(s) from VisitorSession s group by coalesce(s.trafficSource, 'direct') order by count(s) desc")
    List<Object[]> findTopTrafficSources(Pageable pageable);
}
