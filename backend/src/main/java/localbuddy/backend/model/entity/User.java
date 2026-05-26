package localbuddy.backend.model.entity;

@lombok.Getter
@lombok.Setter@jakarta.persistence.Entity
@jakarta.persistence.Table(name = "users")
public class User {
@jakarta.persistence.Id
@org.hibernate.annotations.ColumnDefault("uuid_generate_v4()")
@jakarta.persistence.Column(name = "id", nullable = false)
private java.util.UUID id;

@jakarta.persistence.Column(name = "email", nullable = false)
private java.lang.String email;

@jakarta.persistence.Column(name = "password_hash", nullable = false, length = Integer.MAX_VALUE)
private java.lang.String passwordHash;

@jakarta.persistence.Column(name = "full_name", nullable = false)
private java.lang.String fullName;

@jakarta.persistence.Column(name = "phone", length = 20)
private java.lang.String phone;

@jakarta.persistence.Column(name = "avatar_url", length = Integer.MAX_VALUE)
private java.lang.String avatarUrl;

@org.hibernate.annotations.ColumnDefault("'TRAVELER'")
@jakarta.persistence.Column(name = "role", columnDefinition = "user_role not null")
private java.lang.Object role;

@org.hibernate.annotations.ColumnDefault("false")
@jakarta.persistence.Column(name = "is_buddy", nullable = false)
private java.lang.Boolean isBuddy;

@org.hibernate.annotations.ColumnDefault("true")
@jakarta.persistence.Column(name = "is_active", nullable = false)
private java.lang.Boolean isActive;

@org.hibernate.annotations.ColumnDefault("now()")
@jakarta.persistence.Column(name = "created_at", nullable = false)
private java.time.OffsetDateTime createdAt;

@org.hibernate.annotations.ColumnDefault("now()")
@jakarta.persistence.Column(name = "updated_at", nullable = false)
private java.time.OffsetDateTime updatedAt;

@jakarta.persistence.Column(name = "deleted_at")
private java.time.OffsetDateTime deletedAt;



}