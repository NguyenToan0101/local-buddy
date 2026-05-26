package localbuddy.backend.model.entity;

@lombok.Getter
@lombok.Setter@jakarta.persistence.Entity
@jakarta.persistence.Table(name = "buddy_profiles")
public class BuddyProfile {
@jakarta.persistence.Id
@org.hibernate.annotations.ColumnDefault("uuid_generate_v4()")
@jakarta.persistence.Column(name = "id", nullable = false)
private java.util.UUID id;

@jakarta.persistence.OneToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
@org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@jakarta.persistence.JoinColumn(name = "user_id", nullable = false)
private localbuddy.backend.model.entity.User user;

@jakarta.persistence.Column(name = "age")
private java.lang.Short age;

@jakarta.persistence.Column(name = "location", nullable = false)
private java.lang.String location;

@jakarta.persistence.Column(name = "latitude", precision = 10, scale = 7)
private java.math.BigDecimal latitude;

@jakarta.persistence.Column(name = "longitude", precision = 10, scale = 7)
private java.math.BigDecimal longitude;

@jakarta.persistence.Column(name = "bio", length = Integer.MAX_VALUE)
private java.lang.String bio;

@org.hibernate.annotations.ColumnDefault("'{}'")
@jakarta.persistence.Column(name = "languages")
private java.util.List<java.lang.String> languages;

@org.hibernate.annotations.ColumnDefault("'{}'")
@jakarta.persistence.Column(name = "tags")
private java.util.List<java.lang.String> tags;

@org.hibernate.annotations.ColumnDefault("'{}'")
@jakarta.persistence.Column(name = "interests")
private java.util.List<java.lang.String> interests;

@jakarta.persistence.Column(name = "hourly_rate", nullable = false, precision = 10, scale = 2)
private java.math.BigDecimal hourlyRate;

@org.hibernate.annotations.ColumnDefault("5.0")
@jakarta.persistence.Column(name = "rating", nullable = false, precision = 2, scale = 1)
private java.math.BigDecimal rating;

@org.hibernate.annotations.ColumnDefault("0")
@jakarta.persistence.Column(name = "review_count", nullable = false)
private java.lang.Integer reviewCount;

@org.hibernate.annotations.ColumnDefault("'PENDING'")
@jakarta.persistence.Column(name = "verification_status", columnDefinition = "verification_status not null")
private java.lang.Object verificationStatus;

@jakarta.persistence.Column(name = "id_card_front_url", length = Integer.MAX_VALUE)
private java.lang.String idCardFrontUrl;

@jakarta.persistence.Column(name = "id_card_back_url", length = Integer.MAX_VALUE)
private java.lang.String idCardBackUrl;

@org.hibernate.annotations.ColumnDefault("now()")
@jakarta.persistence.Column(name = "created_at", nullable = false)
private java.time.OffsetDateTime createdAt;

@org.hibernate.annotations.ColumnDefault("now()")
@jakarta.persistence.Column(name = "updated_at", nullable = false)
private java.time.OffsetDateTime updatedAt;



}