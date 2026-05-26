package localbuddy.backend.model.entity;

@lombok.Getter
@lombok.Setter@jakarta.persistence.Entity
@jakarta.persistence.Table(name = "experience_images")
public class ExperienceImage {
@jakarta.persistence.Id
@org.hibernate.annotations.ColumnDefault("uuid_generate_v4()")
@jakarta.persistence.Column(name = "id", nullable = false)
private java.util.UUID id;

@jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
@org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@jakarta.persistence.JoinColumn(name = "experience_id", nullable = false)
private localbuddy.backend.model.entity.Experience experience;

@jakarta.persistence.Column(name = "image_url", nullable = false, length = Integer.MAX_VALUE)
private java.lang.String imageUrl;

@org.hibernate.annotations.ColumnDefault("0")
@jakarta.persistence.Column(name = "display_order")
private java.lang.Integer displayOrder;

@org.hibernate.annotations.ColumnDefault("now()")
@jakarta.persistence.Column(name = "created_at", nullable = false)
private java.time.OffsetDateTime createdAt;



}