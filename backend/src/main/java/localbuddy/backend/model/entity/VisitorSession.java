package localbuddy.backend.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "visitor_sessions")
public class VisitorSession {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "session_key", nullable = false, unique = true)
    private String sessionKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "traffic_source", length = 100)
    private String trafficSource;

    @Column(name = "ip_address", length = 100)
    private String ipAddress;

    @Column(name = "user_agent", length = Integer.MAX_VALUE)
    private String userAgent;

    @Column(name = "referrer", length = Integer.MAX_VALUE)
    private String referrer;

    @Column(name = "landing_page", length = Integer.MAX_VALUE)
    private String landingPage;

    @Column(name = "device_type", length = 50)
    private String deviceType;

    @ColumnDefault("now()")
    @Column(name = "first_visit_at", nullable = false)
    private OffsetDateTime firstVisitAt;

    @ColumnDefault("now()")
    @Column(name = "last_visit_at", nullable = false)
    private OffsetDateTime lastVisitAt;
}
