package localbuddy.backend.model.entity;

@lombok.Getter
@lombok.Setter@jakarta.persistence.Entity
@jakarta.persistence.Table(name = "tourist_profiles")
public class TouristProfile {
@jakarta.persistence.Id
@org.hibernate.annotations.ColumnDefault("uuid_generate_v4()")
@jakarta.persistence.Column(name = "id", nullable = false)
private java.util.UUID id;

@jakarta.persistence.OneToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
@org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@jakarta.persistence.JoinColumn(name = "user_id", nullable = false)
private localbuddy.backend.model.entity.User user;

@jakarta.persistence.Column(name = "nationality", length = 100)
private java.lang.String nationality;

@jakarta.persistence.Column(name = "bio", length = Integer.MAX_VALUE)
private java.lang.String bio;

@org.hibernate.annotations.ColumnDefault("'{}'")
@jakarta.persistence.Column(name = "languages")
private java.util.List<java.lang.String> languages;

@org.hibernate.annotations.ColumnDefault("'{}'")
@jakarta.persistence.Column(name = "interests")
private java.util.List<java.lang.String> interests;

@org.hibernate.annotations.ColumnDefault("now()")
@jakarta.persistence.Column(name = "created_at", nullable = false)
private java.time.OffsetDateTime createdAt;

@org.hibernate.annotations.ColumnDefault("now()")
@jakarta.persistence.Column(name = "updated_at", nullable = false)
private java.time.OffsetDateTime updatedAt;



}