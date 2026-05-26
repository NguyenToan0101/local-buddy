package localbuddy.backend.model.entity;

@lombok.Getter
@lombok.Setter@jakarta.persistence.Entity
@jakarta.persistence.Table(name = "experiences")
public class Experience {
@jakarta.persistence.Id
@org.hibernate.annotations.ColumnDefault("uuid_generate_v4()")
@jakarta.persistence.Column(name = "id", nullable = false)
private java.util.UUID id;

@jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
@org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@jakarta.persistence.JoinColumn(name = "traveler_id", nullable = false)
private localbuddy.backend.model.entity.User traveler;

@jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
@org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@jakarta.persistence.JoinColumn(name = "buddy_id", nullable = false)
private localbuddy.backend.model.entity.User buddy;

@jakarta.persistence.Column(name = "title", nullable = false)
private java.lang.String title;

@jakarta.persistence.Column(name = "story_content", nullable = false, length = Integer.MAX_VALUE)
private java.lang.String storyContent;

@jakarta.persistence.Column(name = "location")
private java.lang.String location;

@jakarta.persistence.Column(name = "rating")
private java.lang.Short rating;

@org.hibernate.annotations.ColumnDefault("'{}'")
@jakarta.persistence.Column(name = "tags")
private java.util.List<java.lang.String> tags;

@org.hibernate.annotations.ColumnDefault("false")
@jakarta.persistence.Column(name = "is_pinned", nullable = false)
private java.lang.Boolean isPinned;

@org.hibernate.annotations.ColumnDefault("now()")
@jakarta.persistence.Column(name = "created_at", nullable = false)
private java.time.OffsetDateTime createdAt;

@jakarta.persistence.OneToMany(mappedBy = "experience")
private java.util.Set<localbuddy.backend.model.entity.ExperienceImage> experienceImages = new java.util.LinkedHashSet<>();



}