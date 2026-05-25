package localbuddy.backend.model.entity;


import jakarta.persistence.*;
import localbuddy.backend.model.enums.CancellationBy;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "cancellations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cancellation {

    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Enumerated(EnumType.STRING)
    @Column(name = "cancelled_by", nullable = false, columnDefinition = "cancellation_by")
    private CancellationBy cancelledBy;

    /** Người thực hiện hủy */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelled_by_user")
    private User cancelledByUser;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    /** Số giờ trước lịch hẹn tại thời điểm hủy */
    @Column(name = "hours_before", precision = 6, scale = 2)
    private BigDecimal hoursBefore;

    /**
     * Các trường bên dưới được tự động tính bởi trigger calc_cancellation_refund.
     * insertable = false, updatable = false để JPA không ghi đè.
     */
    @Column(name = "refund_amount", nullable = false,
            insertable = false, updatable = false, precision = 12, scale = 2)
    private BigDecimal refundAmount = BigDecimal.ZERO;

    @Column(name = "refund_pct", nullable = false,
            insertable = false, updatable = false, precision = 5, scale = 2)
    private BigDecimal refundPct = BigDecimal.ZERO;

    @Column(name = "buddy_compensation", nullable = false,
            insertable = false, updatable = false, precision = 12, scale = 2)
    private BigDecimal buddyCompensation = BigDecimal.ZERO;

    @Column(name = "platform_share", nullable = false,
            insertable = false, updatable = false, precision = 12, scale = 2)
    private BigDecimal platformShare = BigDecimal.ZERO;

    @Column(name = "cancelled_at", nullable = false, updatable = false)
    private OffsetDateTime cancelledAt;

    @PrePersist
    protected void onCreate() {
        this.cancelledAt = OffsetDateTime.now();
    }
}
