package localbuddy.backend.controller;

import localbuddy.backend.dto.ChatMessageDto;
import localbuddy.backend.dto.ChatMessageRequest;
import localbuddy.backend.dto.ConversationDto;
import localbuddy.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ChatController {

    private final ChatService chatService;

    @GetMapping
    public ResponseEntity<List<ConversationDto>> getConversations() {
        return ResponseEntity.ok(chatService.getConversations(getCurrentUserId()));
    }

    @PostMapping("/buddy/{buddyId}")
    public ResponseEntity<ConversationDto> getOrCreateConversation(@PathVariable UUID buddyId) {
        return ResponseEntity.ok(chatService.getOrCreateConversationWithBuddy(getCurrentUserId(), buddyId));
    }

    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<List<ChatMessageDto>> getMessages(@PathVariable UUID conversationId) {
        return ResponseEntity.ok(chatService.getMessages(getCurrentUserId(), conversationId));
    }

    @PostMapping("/{conversationId}/messages")
    public ResponseEntity<ConversationDto> sendMessage(
            @PathVariable UUID conversationId,
            @RequestBody ChatMessageRequest request
    ) {
        return ResponseEntity.ok(chatService.sendMessage(getCurrentUserId(), conversationId, request));
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("User not authenticated.");
        }

        Object credentials = authentication.getCredentials();
        if (!(credentials instanceof String userId)) {
            throw new IllegalArgumentException("User ID not found in authentication.");
        }

        return UUID.fromString(userId);
    }
}
