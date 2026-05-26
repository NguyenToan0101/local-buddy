package localbuddy.backend.model.entity;

@lombok.Getter
@lombok.Setter@jakarta.persistence.Entity
@jakarta.persistence.Table(name = "notifications")
public class Notification {
@jakarta.persistence.Id
@org.hibernate.annotations.ColumnDefault("uuid_generate_v4()")
@jakarta.persistence.Column(name = "id", nullable = false)
private java.util.UUID id;

@jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
@org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@jakarta.persistence.JoinColumn(name = "receiver_id", nullable = false)
private localbuddy.backend.model.entity.User receiver;

@jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
@org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.SET_NULL)
@jakarta.persistence.JoinColumn(name = "sender_id")
private localbuddy.backend.model.entity.User sender;

@jakarta.persistence.Column(name = "type", nullable = false, length = 100)
private java.lang.String type;

@jakarta.persistence.Column(name = "title", nullable = false)
private java.lang.String title;

@jakarta.persistence.Column(name = "content", nullable = false, length = Integer.MAX_VALUE)
private java.lang.String content;

@org.hibernate.annotations.ColumnDefault("false")
@jakarta.persistence.Column(name = "is_read", nullable = false)
private java.lang.Boolean isRead;

@org.hibernate.annotations.ColumnDefault("now()")
@jakarta.persistence.Column(name = "created_at", nullable = false)
private java.time.OffsetDateTime createdAt;



}