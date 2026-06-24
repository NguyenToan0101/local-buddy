package localbuddy.backend.model.entity;

import jakarta.persistence.*;
import localbuddy.backend.model.enums.VerificationStatus;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "tourist_profiles")
public class TouristProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "nationality", length = 100)
    private String nationality;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @ColumnDefault("'{}'")
    @Column(name = "languages")
    private List<String> languages;

    @ColumnDefault("'{}'")
    @Column(name = "interests")
    private List<String> interests;

    @Column(name = "e_visa_number", length = 120)
    private String eVisaNumber;

    @Column(name = "e_visa_country", length = 120)
    private String eVisaCountry;

    @Column(name = "e_visa_expiry_date", length = 40)
    private String eVisaExpiryDate;

    @Column(name = "e_visa_evidence_url", columnDefinition = "TEXT")
    private String eVisaEvidenceUrl;

    @JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    @ColumnDefault("'PENDING'")
    @Column(name = "verification_status", columnDefinition = "verification_status not null")
    @Enumerated(EnumType.STRING)
    private VerificationStatus verificationStatus;

    @ColumnDefault("now()")
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @ColumnDefault("now()")
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
