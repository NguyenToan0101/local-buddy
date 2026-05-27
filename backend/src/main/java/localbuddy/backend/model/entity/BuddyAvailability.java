package localbuddy.backend.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "buddy_availabilities")
public class BuddyAvailability {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buddy_id", nullable = false)
    private User buddy;

    @Column(name = "slot_date", nullable = false)
    private String slotDate; // e.g. "May 28, 2026"

    @Column(name = "slot_time", nullable = false)
    private String slotTime; // e.g. "08:00 AM"

    @Column(name = "status", nullable = false)
    private String status; // e.g. "FREE"

    @Column(name = "title", nullable = false)
    private String title; // e.g. "Available"

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}
