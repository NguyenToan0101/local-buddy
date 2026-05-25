package localbuddy.backend.model.entity;


import jakarta.persistence.*;
import localbuddy.backend.model.enums.MatchStatus;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
    name = "matches",
    uniqueConstraints = @UniqueConstraint(columnNames = {"tourist_id", "buddy_id"}),
    indexes = {
        @Index(name = "idx_matches_tourist", columnList = "tourist_id"),
        @Index(name = "idx_matches_buddy",   columnList = "buddy_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Match {

    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "uuid")
    private UUID id;

    /** Khách du lịch */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tourist_id", nullable = false)
    private User tourist;

    /** Local Buddy */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buddy_id", nullable = false)
    private User buddy;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "match_status")
    private MatchStatus status = MatchStatus.pending;

    /** Khách quẹt phải (true) / trái (false) */
    @Column(name = "tourist_liked")
    private Boolean touristLiked;

    /** Buddy đồng ý (true) / từ chối (false) */
    @Column(name = "buddy_liked")
    private Boolean buddyLiked;

    /** Thời điểm match thành công */
    @Column(name = "matched_at")
    private OffsetDateTime matchedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    // --------------------------------------------------------
    // Relationships
    // --------------------------------------------------------

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Message> messages;

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Booking> bookings;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
    }
}
