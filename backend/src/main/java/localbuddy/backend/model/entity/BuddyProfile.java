package localbuddy.backend.model.entity;

import jakarta.persistence.*;
import localbuddy.backend.model.enums.VerificationStatus;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "buddy_profiles")
public class BuddyProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "age")
    private Short age;

    @Column(name = "location", nullable = false)
    private String location;

    @Column(name = "latitude", precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @ColumnDefault("'{}'")
    @Column(name = "languages")
    private List<String> languages;

    @ColumnDefault("'{}'")
    @Column(name = "tags")
    private List<String> tags;

    @ColumnDefault("'{}'")
    @Column(name = "interests")
    private List<String> interests;

    @Column(name = "hourly_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @ColumnDefault("5.0")
    @Column(name = "rating", nullable = false, precision = 2, scale = 1)
    private BigDecimal rating;

    @ColumnDefault("0")
    @Column(name = "review_count", nullable = false)
    private Integer reviewCount;

    @JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    @ColumnDefault("'PENDING'")
    @Column(name = "verification_status", columnDefinition = "verification_status not null")
    @Enumerated(EnumType.STRING)
    private VerificationStatus verificationStatus;

    @Column(name = "id_card_front_url", columnDefinition = "TEXT")
    private String idCardFrontUrl;

    @Column(name = "id_card_back_url", columnDefinition = "TEXT")
    private String idCardBackUrl;

    @Column(name = "selfie_url", columnDefinition = "TEXT")
    private String selfieUrl;

    @Column(name = "extracted_full_name")
    private String extractedFullName;

    @Column(name = "extracted_id_number")
    private String extractedIdNumber;

    @Column(name = "extracted_date_of_birth")
    private String extractedDateOfBirth;

    @Column(name = "face_match_score")
    private Double faceMatchScore;

    @Column(name = "liveness_score")
    private Double livenessScore;

    @Column(name = "verification_score")
    private Double verificationScore;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "verified_at")
    private OffsetDateTime verifiedAt;

    @Column(name = "processed_at")
    private OffsetDateTime processedAt;

    @Column(name = "auto_verification_message", columnDefinition = "TEXT")
    private String autoVerificationMessage;

    @Column(name = "quality_score")
    private Double qualityScore;

    @Column(name = "anti_spoof_score")
    private Double antiSpoofScore;

    @Column(name = "risk_score")
    private Double riskScore;

    @Column(name = "risk_reason", columnDefinition = "TEXT")
    private String riskReason;

    @Column(name = "duplicate_detected")
    private Boolean duplicateDetected;

    @Column(name = "duplicate_user_id")
    private UUID duplicateUserId;

    @Column(name = "liveness_details", columnDefinition = "TEXT")
    private String livenessDetails;

    @Column(name = "anti_spoof_details", columnDefinition = "TEXT")
    private String antiSpoofDetails;

    @Column(name = "quality_details", columnDefinition = "TEXT")
    private String qualityDetails;

    @Column(name = "ocr_raw_text", columnDefinition = "TEXT")
    private String ocrRawText;

    @Column(name = "ocr_score")
    private Double ocrScore;

    @ColumnDefault("now()")
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @ColumnDefault("now()")
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;


}
