package localbuddy.backend.model.entity;

@lombok.Getter
@lombok.Setter@jakarta.persistence.Entity
@jakarta.persistence.Table(name = "reviews")
public class Review {
@jakarta.persistence.Id
@org.hibernate.annotations.ColumnDefault("uuid_generate_v4()")
@jakarta.persistence.Column(name = "id", nullable = false)
private java.util.UUID id;

@jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
@org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@jakarta.persistence.JoinColumn(name = "booking_id", nullable = false)
private localbuddy.backend.model.entity.Booking booking;

@jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
@org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@jakarta.persistence.JoinColumn(name = "reviewer_id", nullable = false)
private localbuddy.backend.model.entity.User reviewer;

@jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
@org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@jakarta.persistence.JoinColumn(name = "reviewee_id", nullable = false)
private localbuddy.backend.model.entity.User reviewee;

@jakarta.persistence.Column(name = "rating", nullable = false)
private java.lang.Short rating;

@jakarta.persistence.Column(name = "comment", length = Integer.MAX_VALUE)
private java.lang.String comment;

@org.hibernate.annotations.ColumnDefault("true")
@jakarta.persistence.Column(name = "is_public", nullable = false)
private java.lang.Boolean isPublic;

@org.hibernate.annotations.ColumnDefault("now()")
@jakarta.persistence.Column(name = "created_at", nullable = false)
private java.time.OffsetDateTime createdAt;



}