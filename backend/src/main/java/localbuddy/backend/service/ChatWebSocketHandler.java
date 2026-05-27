package localbuddy.backend.service;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final Map<UUID, Set<WebSocketSession>> sessionsByUser = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        UUID userId = getUserId(session);
        sessionsByUser.computeIfAbsent(userId, ignored -> ConcurrentHashMap.newKeySet()).add(session);
        send(session, Map.of("type", "connected"));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        send(session, Map.of("type", "pong"));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        UUID userId = getUserId(session);
        Set<WebSocketSession> sessions = sessionsByUser.get(userId);
        if (sessions != null) {
            sessions.remove(session);
            if (sessions.isEmpty()) {
                sessionsByUser.remove(userId);
            }
        }
    }

    public void notifyMessagesChanged(UUID userId) {
        Set<WebSocketSession> sessions = sessionsByUser.get(userId);
        if (sessions == null) {
            return;
        }

        for (WebSocketSession session : sessions) {
            send(session, Map.of("type", "messages"));
        }
    }

    private UUID getUserId(WebSocketSession session) {
        Object userId = session.getAttributes().get("userId");
        return UUID.fromString(String.valueOf(userId));
    }

    private void send(WebSocketSession session, Map<String, String> payload) {
        if (!session.isOpen()) {
            return;
        }

        try {
            session.sendMessage(new TextMessage(toJson(payload)));
        } catch (IOException ignored) {
        }
    }

    private String toJson(Map<String, String> payload) {
        String type = payload.getOrDefault("type", "");
        return "{\"type\":\"" + type.replace("\"", "\\\"") + "\"}";
    }
}
