package localbuddy.backend.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "experiences")
public class Experience {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "traveler_id", nullable = false)
    private User traveler;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "buddy_id", nullable = false)
    private User buddy;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "story_content", nullable = false, length = Integer.MAX_VALUE)
    private String storyContent;

    @Column(name = "location")
    private String location;

    @Column(name = "rating")
    private Short rating;

    @ColumnDefault("'{}'")
    @Column(name = "tags")
    private List<String> tags;

    @ColumnDefault("false")
    @Column(name = "is_pinned", nullable = false)
    private Boolean isPinned;

    @ColumnDefault("now()")
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @OneToMany(mappedBy = "experience")
    private Set<ExperienceImage> experienceImages = new LinkedHashSet<>();


}