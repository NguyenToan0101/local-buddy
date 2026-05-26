package localbuddy.backend.model.entity;

import jakarta.persistence.*;
import localbuddy.backend.model.enums.PaymentStatus;
import localbuddy.backend.model.enums.PaymentType;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "payments")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "payer_id", nullable = false)
    private User payer;

    @Column(name = "payment_type", columnDefinition = "payment_type not null")
    @Enumerated(EnumType.STRING)
    private PaymentType paymentType;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @ColumnDefault("'PENDING'")
    @Column(name = "status", columnDefinition = "payment_status not null")
    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    @Column(name = "payment_method", length = 100)
    private String paymentMethod;

    @Column(name = "transaction_reference")
    private String transactionReference;

    @ColumnDefault("now()")
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "paid_at")
    private OffsetDateTime paidAt;


}