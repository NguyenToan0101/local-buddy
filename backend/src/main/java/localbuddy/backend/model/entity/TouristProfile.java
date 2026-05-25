package localbuddy.backend.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tourist_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TouristProfile {

    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "uuid")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "nationality", length = 100)
    private String nationality;

    @Column(name = "age")
    private Short age;

    /** Ngôn ngữ sử dụng – lưu dạng mảng TEXT[] trong PostgreSQL */
    @Column(name = "languages", columnDefinition = "TEXT[]")
    @Convert(converter = StringListConverter.class)
    private List<String> languages;

    /** Sở thích: ẩm thực, cà phê, đi bộ... */
    @Column(name = "interests", columnDefinition = "TEXT[]")
    @Convert(converter = StringListConverter.class)
    private List<String> interests;

    /** Phong cách trải nghiệm mong muốn */
    @Column(name = "experience_style", columnDefinition = "TEXT")
    private String experienceStyle;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
