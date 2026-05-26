package localbuddy.backend.model.entity;

@lombok.Getter
@lombok.Setter@jakarta.persistence.Entity
@jakarta.persistence.Table(name = "bookings")
public class Booking {
@jakarta.persistence.Id
@org.hibernate.annotations.ColumnDefault("uuid_generate_v4()")
@jakarta.persistence.Column(name = "id", nullable = false)
private java.util.UUID id;

@jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
@org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@jakarta.persistence.JoinColumn(name = "traveler_id", nullable = false)
private localbuddy.backend.model.entity.User traveler;

@jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
@org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@jakarta.persistence.JoinColumn(name = "buddy_id", nullable = false)
private localbuddy.backend.model.entity.User buddy;

@jakarta.persistence.Column(name = "title", nullable = false)
private java.lang.String title;

@jakarta.persistence.Column(name = "description", length = Integer.MAX_VALUE)
private java.lang.String description;

@jakarta.persistence.Column(name = "location", nullable = false)
private java.lang.String location;

@jakarta.persistence.Column(name = "start_time", nullable = false)
private java.time.OffsetDateTime startTime;

@jakarta.persistence.Column(name = "end_time", nullable = false)
private java.time.OffsetDateTime endTime;

@jakarta.persistence.Column(name = "total_hours", nullable = false)
private java.lang.Integer totalHours;

@jakarta.persistence.Column(name = "total_price", nullable = false, precision = 10, scale = 2)
private java.math.BigDecimal totalPrice;

@org.hibernate.annotations.ColumnDefault("'PENDING'")
@jakarta.persistence.Column(name = "status", columnDefinition = "booking_status not null")
private java.lang.Object status;

@org.hibernate.annotations.ColumnDefault("'NOT_STARTED'")
@jakarta.persistence.Column(name = "meetup_status", columnDefinition = "meetup_status not null")
private java.lang.Object meetupStatus;

@org.hibernate.annotations.ColumnDefault("now()")
@jakarta.persistence.Column(name = "created_at", nullable = false)
private java.time.OffsetDateTime createdAt;

@org.hibernate.annotations.ColumnDefault("now()")
@jakarta.persistence.Column(name = "updated_at", nullable = false)
private java.time.OffsetDateTime updatedAt;

@jakarta.persistence.OneToOne(mappedBy = "booking")
private localbuddy.backend.model.entity.Cancellation cancellation;

@jakarta.persistence.OneToMany(mappedBy = "booking")
private java.util.Set<localbuddy.backend.model.entity.EarningsTransaction> earningsTransactions = new java.util.LinkedHashSet<>();

@jakarta.persistence.OneToMany(mappedBy = "booking")
private java.util.Set<localbuddy.backend.model.entity.Payment> payments = new java.util.LinkedHashSet<>();

@jakarta.persistence.OneToMany(mappedBy = "booking")
private java.util.Set<localbuddy.backend.model.entity.Review> reviews = new java.util.LinkedHashSet<>();



}