package localbuddy.backend.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "buddy_violations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuddyViolation {

    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "uuid")
    private UUID id;

    /** Buddy bị vi phạm */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buddy_id", nullable = false)
    private User buddy;

    /** Booking liên quan (nullable) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    /**
     * Loại vi phạm:
     * "cancellation" | "low_rating" | "policy_breach"
     */
    @Column(name = "violation_type", nullable = false, length = 100)
    private String violationType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * Hành động xử lý:
     * "warning" | "score_deducted" | "suspended" | "banned"
     */
    @Column(name = "action_taken", length = 100)
    private String actionTaken;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
    }
}
