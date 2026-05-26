package localbuddy.backend.model.entity;

@lombok.Getter
@lombok.Setter@jakarta.persistence.Entity
@jakarta.persistence.Table(name = "earnings_transactions")
public class EarningsTransaction {
@jakarta.persistence.Id
@org.hibernate.annotations.ColumnDefault("uuid_generate_v4()")
@jakarta.persistence.Column(name = "id", nullable = false)
private java.util.UUID id;

@jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
@org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@jakarta.persistence.JoinColumn(name = "buddy_id", nullable = false)
private localbuddy.backend.model.entity.User buddy;

@jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
@org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.SET_NULL)
@jakarta.persistence.JoinColumn(name = "booking_id")
private localbuddy.backend.model.entity.Booking booking;

@jakarta.persistence.Column(name = "transaction_type", columnDefinition = "transaction_type not null")
private java.lang.Object transactionType;

@jakarta.persistence.Column(name = "amount", nullable = false, precision = 10, scale = 2)
private java.math.BigDecimal amount;

@jakarta.persistence.Column(name = "description", length = Integer.MAX_VALUE)
private java.lang.String description;

@org.hibernate.annotations.ColumnDefault("now()")
@jakarta.persistence.Column(name = "created_at", nullable = false)
private java.time.OffsetDateTime createdAt;



}