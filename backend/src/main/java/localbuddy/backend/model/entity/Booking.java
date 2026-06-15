package localbuddy.backend.model.entity;

import jakarta.persistence.*;
import localbuddy.backend.model.enums.BookingStatus;
import localbuddy.backend.model.enums.MeetupStatus;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "bookings")
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "traveler_id", nullable = false)
    private User traveler;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "buddy_id", nullable = false)
    private User buddy;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    @Column(name = "location", nullable = false)
    private String location;

    @Column(name = "start_time", nullable = false)
    private OffsetDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private OffsetDateTime endTime;

    @Column(name = "total_hours", nullable = false)
    private Integer totalHours;

    @ColumnDefault("1")
    @Column(name = "guest_count", nullable = false)
    private Integer guestCount;

    @Column(name = "total_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @ColumnDefault("'PENDING'")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", columnDefinition = "booking_status not null")
    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    @ColumnDefault("'NOT_STARTED'")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "meetup_status", columnDefinition = "meetup_status not null")
    @Enumerated(EnumType.STRING)
    private MeetupStatus meetupStatus;

    @ColumnDefault("now()")
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @ColumnDefault("now()")
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "meetup_qr_token")
    private String meetupQrToken;

    @Column(name = "meetup_qr_expires_at")
    private OffsetDateTime meetupQrExpiresAt;

    @OneToOne(mappedBy = "booking")
    private Cancellation cancellation;

    @OneToMany(mappedBy = "booking")
    private Set<EarningsTransaction> earningsTransactions = new LinkedHashSet<>();

    @OneToMany(mappedBy = "booking")
    private Set<Payment> payments = new LinkedHashSet<>();

    @OneToMany(mappedBy = "booking")
    private Set<Review> reviews = new LinkedHashSet<>();


}
