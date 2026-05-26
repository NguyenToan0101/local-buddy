package localbuddy.backend.model.entity;

@lombok.Getter
@lombok.Setter@jakarta.persistence.Entity
@jakarta.persistence.Table(name = "cancellations")
public class Cancellation {
@jakarta.persistence.Id
@org.hibernate.annotations.ColumnDefault("uuid_generate_v4()")
@jakarta.persistence.Column(name = "id", nullable = false)
private java.util.UUID id;

@jakarta.persistence.OneToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
@org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@jakarta.persistence.JoinColumn(name = "booking_id", nullable = false)
private localbuddy.backend.model.entity.Booking booking;

@jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
@org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@jakarta.persistence.JoinColumn(name = "cancelled_by_user_id", nullable = false)
private localbuddy.backend.model.entity.User cancelledByUser;

@jakarta.persistence.Column(name = "reason", length = Integer.MAX_VALUE)
private java.lang.String reason;

@org.hibernate.annotations.ColumnDefault("0")
@jakarta.persistence.Column(name = "refund_amount", precision = 10, scale = 2)
private java.math.BigDecimal refundAmount;

@org.hibernate.annotations.ColumnDefault("0")
@jakarta.persistence.Column(name = "cancellation_fee", precision = 10, scale = 2)
private java.math.BigDecimal cancellationFee;

@org.hibernate.annotations.ColumnDefault("now()")
@jakarta.persistence.Column(name = "created_at", nullable = false)
private java.time.OffsetDateTime createdAt;



}