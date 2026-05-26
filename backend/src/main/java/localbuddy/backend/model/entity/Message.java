package localbuddy.backend.model.entity;

@lombok.Getter
@lombok.Setter@jakarta.persistence.Entity
@jakarta.persistence.Table(name = "messages")
public class Message {
@jakarta.persistence.Id
@org.hibernate.annotations.ColumnDefault("uuid_generate_v4()")
@jakarta.persistence.Column(name = "id", nullable = false)
private java.util.UUID id;

@jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
@org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@jakarta.persistence.JoinColumn(name = "conversation_id", nullable = false)
private localbuddy.backend.model.entity.Conversation conversation;

@jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
@org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@jakarta.persistence.JoinColumn(name = "sender_id", nullable = false)
private localbuddy.backend.model.entity.User sender;

@jakarta.persistence.Column(name = "content", nullable = false, length = Integer.MAX_VALUE)
private java.lang.String content;

@org.hibernate.annotations.ColumnDefault("false")
@jakarta.persistence.Column(name = "is_offer", nullable = false)
private java.lang.Boolean isOffer;

@jakarta.persistence.Column(name = "offered_hours")
private java.lang.Integer offeredHours;

@jakarta.persistence.Column(name = "offered_price", precision = 10, scale = 2)
private java.math.BigDecimal offeredPrice;

@org.hibernate.annotations.ColumnDefault("false")
@jakarta.persistence.Column(name = "is_read", nullable = false)
private java.lang.Boolean isRead;

@org.hibernate.annotations.ColumnDefault("now()")
@jakarta.persistence.Column(name = "created_at", nullable = false)
private java.time.OffsetDateTime createdAt;

@jakarta.persistence.OneToMany(mappedBy = "lastMessage")
private java.util.Set<localbuddy.backend.model.entity.Conversation> conversations = new java.util.LinkedHashSet<>();



}