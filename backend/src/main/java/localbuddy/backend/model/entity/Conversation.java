package localbuddy.backend.model.entity;

@lombok.Getter
@lombok.Setter@jakarta.persistence.Entity
@jakarta.persistence.Table(name = "conversations")
public class Conversation {
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

@jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
@org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.SET_NULL)
@jakarta.persistence.JoinColumn(name = "last_message_id")
private localbuddy.backend.model.entity.Message lastMessage;

@jakarta.persistence.Column(name = "last_message_at")
private java.time.OffsetDateTime lastMessageAt;

@org.hibernate.annotations.ColumnDefault("now()")
@jakarta.persistence.Column(name = "created_at", nullable = false)
private java.time.OffsetDateTime createdAt;

@org.hibernate.annotations.ColumnDefault("now()")
@jakarta.persistence.Column(name = "updated_at", nullable = false)
private java.time.OffsetDateTime updatedAt;

@jakarta.persistence.OneToMany(mappedBy = "conversation")
private java.util.Set<localbuddy.backend.model.entity.Message> messages = new java.util.LinkedHashSet<>();



}