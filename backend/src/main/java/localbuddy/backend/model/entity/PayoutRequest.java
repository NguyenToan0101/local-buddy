package localbuddy.backend.model.entity;

@lombok.Getter
@lombok.Setter@jakarta.persistence.Entity
@jakarta.persistence.Table(name = "payout_requests")
public class PayoutRequest {
@jakarta.persistence.Id
@org.hibernate.annotations.ColumnDefault("uuid_generate_v4()")
@jakarta.persistence.Column(name = "id", nullable = false)
private java.util.UUID id;

@jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
@org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@jakarta.persistence.JoinColumn(name = "buddy_id", nullable = false)
private localbuddy.backend.model.entity.User buddy;

@jakarta.persistence.Column(name = "amount", nullable = false, precision = 10, scale = 2)
private java.math.BigDecimal amount;

@org.hibernate.annotations.ColumnDefault("10.00")
@jakarta.persistence.Column(name = "tax_rate", nullable = false, precision = 5, scale = 2)
private java.math.BigDecimal taxRate;

@org.hibernate.annotations.ColumnDefault("'PENDING'")
@jakarta.persistence.Column(name = "status", columnDefinition = "payout_status not null")
private java.lang.Object status;

@jakarta.persistence.Column(name = "bank_name", nullable = false)
private java.lang.String bankName;

@jakarta.persistence.Column(name = "bank_account_name", nullable = false)
private java.lang.String bankAccountName;

@jakarta.persistence.Column(name = "bank_account_number", nullable = false, length = 100)
private java.lang.String bankAccountNumber;

@org.hibernate.annotations.ColumnDefault("now()")
@jakarta.persistence.Column(name = "requested_at", nullable = false)
private java.time.OffsetDateTime requestedAt;

@jakarta.persistence.Column(name = "processed_at")
private java.time.OffsetDateTime processedAt;



}