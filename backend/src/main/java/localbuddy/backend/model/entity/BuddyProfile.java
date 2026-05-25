package localbuddy.backend.model.entity;


import jakarta.persistence.*;
import localbuddy.backend.model.enums.BuddyStatus;
import lombok.*;


import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "buddy_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuddyProfile {

    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "uuid")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "buddy_status")
    private BuddyStatus status = BuddyStatus.pending;

    /** Trình độ ngoại ngữ */
    @Column(name = "language_level", length = 100)
    private String languageLevel;

    /** Giới thiệu bản thân và phong cách đồng hành */
    @Column(name = "self_introduction", columnDefinition = "TEXT")
    private String selfIntroduction;

    /** Sở thích, thế mạnh */
    @Column(name = "strengths", columnDefinition = "TEXT[]")
    @Convert(converter = StringListConverter.class)
    private List<String> strengths;

    /** Khu vực sinh sống */
    @Column(name = "living_area", length = 255)
    private String livingArea;

    @Column(name = "id_verified", nullable = false)
    private Boolean idVerified = false;

    /** Ảnh xác thực */
    @Column(name = "id_photo_url", columnDefinition = "TEXT")
    private String idPhotoUrl;

    @Column(name = "rating_avg", precision = 3, scale = 2)
    private BigDecimal ratingAvg = BigDecimal.ZERO;

    @Column(name = "total_reviews", nullable = false)
    private Integer totalReviews = 0;

    @Column(name = "total_sessions", nullable = false)
    private Integer totalSessions = 0;

    /** Có hiển thị trên nền tảng không */
    @Column(name = "is_visible", nullable = false)
    private Boolean isVisible = true;

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
