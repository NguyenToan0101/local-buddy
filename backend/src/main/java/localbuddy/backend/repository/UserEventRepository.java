package localbuddy.backend.repository;

import localbuddy.backend.model.entity.UserEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserEventRepository extends JpaRepository<UserEvent, UUID> {
    @Query("select e.pageUrl, count(e) from UserEvent e where e.eventType = 'PAGE_VIEW' and e.pageUrl is not null group by e.pageUrl order by count(e) desc")
    List<Object[]> findPopularPages(Pageable pageable);

    @Query("select e.eventType, count(e) from UserEvent e group by e.eventType order by count(e) desc")
    List<Object[]> findTopEvents(Pageable pageable);

    @Query("select e, s from UserEvent e left join VisitorSession s on s.sessionKey = e.sessionKey order by e.createdAt desc")
    List<Object[]> findRecentActivity(Pageable pageable);
}
