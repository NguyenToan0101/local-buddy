package localbuddy.backend.model.entity;


import jakarta.persistence.*;
import localbuddy.backend.model.enums.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "payments",
    indexes = @Index(name = "idx_payments_booking", columnList = "booking_id")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "uuid")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    /** Khách du lịch thanh toán */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payer_id", nullable = false)
    private User payer;

    /** Tổng tiền */
    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    /** Tiền đặt cọc (30–50%) */
    @Column(name = "deposit_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal depositAmount;

    /** % đặt cọc (default 30%) */
    @Column(name = "deposit_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal depositPct = new BigDecimal("30.00");

    /** Số tiền còn lại sau khi đặt cọc */
    @Column(name = "remaining_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal remainingAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "payment_status")
    private PaymentStatus status = PaymentStatus.pending;

    @Column(name = "payment_method", length = 100)
    private String paymentMethod;

    /** Mã giao dịch từ cổng thanh toán */
    @Column(name = "transaction_ref", length = 255)
    private String transactionRef;

    /** Nền tảng giữ tiền (escrow) */
    @Column(name = "escrow_held", nullable = false)
    private Boolean escrowHeld = true;

    @Column(name = "deposited_at")
    private OffsetDateTime depositedAt;

    @Column(name = "fully_paid_at")
    private OffsetDateTime fullyPaidAt;

    /** Thời điểm giải phóng tiền cho Buddy */
    @Column(name = "released_at")
    private OffsetDateTime releasedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
