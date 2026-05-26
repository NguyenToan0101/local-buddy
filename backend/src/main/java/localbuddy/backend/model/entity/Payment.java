package localbuddy.backend.model.entity;

@lombok.Getter
@lombok.Setter@jakarta.persistence.Entity
@jakarta.persistence.Table(name = "payments")
public class Payment {
@jakarta.persistence.Id
@org.hibernate.annotations.ColumnDefault("uuid_generate_v4()")
@jakarta.persistence.Column(name = "id", nullable = false)
private java.util.UUID id;

@jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
@org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@jakarta.persistence.JoinColumn(name = "booking_id", nullable = false)
private localbuddy.backend.model.entity.Booking booking;

@jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
@org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@jakarta.persistence.JoinColumn(name = "payer_id", nullable = false)
private localbuddy.backend.model.entity.User payer;

@jakarta.persistence.Column(name = "payment_type", columnDefinition = "payment_type not null")
private java.lang.Object paymentType;

@jakarta.persistence.Column(name = "amount", nullable = false, precision = 10, scale = 2)
private java.math.BigDecimal amount;

@org.hibernate.annotations.ColumnDefault("'PENDING'")
@jakarta.persistence.Column(name = "status", columnDefinition = "payment_status not null")
private java.lang.Object status;

@jakarta.persistence.Column(name = "payment_method", length = 100)
private java.lang.String paymentMethod;

@jakarta.persistence.Column(name = "transaction_reference")
private java.lang.String transactionReference;

@org.hibernate.annotations.ColumnDefault("now()")
@jakarta.persistence.Column(name = "created_at", nullable = false)
private java.time.OffsetDateTime createdAt;

@jakarta.persistence.Column(name = "paid_at")
private java.time.OffsetDateTime paidAt;



}