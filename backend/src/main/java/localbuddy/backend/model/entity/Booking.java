package localbuddy.backend.model.entity;


import jakarta.persistence.*;
import localbuddy.backend.model.enums.ActivityGroup;
import localbuddy.backend.model.enums.BookingStatus;
import lombok.*;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
    name = "bookings",
    indexes = {
        @Index(name = "idx_bookings_tourist", columnList = "tourist_id"),
        @Index(name = "idx_bookings_buddy",   columnList = "buddy_id"),
        @Index(name = "idx_bookings_date",    columnList = "scheduled_date")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tourist_id", nullable = false)
    private User tourist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buddy_id", nullable = false)
    private User buddy;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_group", nullable = false, columnDefinition = "activity_group")
    private ActivityGroup activityGroup;

    /** Mô tả tự do của khách */
    @Column(name = "custom_description", columnDefinition = "TEXT")
    private String customDescription;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    /**
     * duration_hours is a GENERATED ALWAYS column in PostgreSQL.
     * Mark as insertable=false, updatable=false so JPA never writes it.
     */
    @Column(name = "duration_hours", insertable = false, updatable = false, precision = 4, scale = 2)
    private BigDecimal durationHours;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "booking_status")
    private BookingStatus status = BookingStatus.pending;

    /** Giá / giờ */
    @Column(name = "hourly_rate", nullable = false, precision = 12, scale = 2)
    private BigDecimal hourlyRate;

    /** Tổng số tiền */
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    /** % hoa hồng nền tảng (default 20%) */
    @Column(name = "platform_fee_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal platformFeePct = new BigDecimal("20.00");

    /** Tính bởi trigger calc_booking_fees – không ghi từ JPA */
    @Column(name = "platform_fee_amount", insertable = false, updatable = false, precision = 12, scale = 2)
    private BigDecimal platformFeeAmount;

    /** Tính bởi trigger calc_booking_fees – không ghi từ JPA */
    @Column(name = "buddy_payout", insertable = false, updatable = false, precision = 12, scale = 2)
    private BigDecimal buddyPayout;

    /** Đề xuất điều chỉnh từ Buddy */
    @Column(name = "buddy_response", columnDefinition = "TEXT")
    private String buddyResponse;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    // --------------------------------------------------------
    // Relationships
    // --------------------------------------------------------

    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Payment payment;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Review> reviews;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Cancellation> cancellations;

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
