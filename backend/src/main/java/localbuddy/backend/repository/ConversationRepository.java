package localbuddy.backend.repository;

import localbuddy.backend.model.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
    Optional<Conversation> findByTravelerIdAndBuddyId(UUID travelerId, UUID buddyId);

    List<Conversation> findByTravelerIdOrBuddyIdOrderByLastMessageAtDesc(UUID travelerId, UUID buddyId);
}
