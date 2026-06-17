package localbuddy.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import localbuddy.backend.dto.AnalyticsActivityDto;
import localbuddy.backend.dto.AnalyticsEventDto;
import localbuddy.backend.dto.AnalyticsOverviewDto;
import localbuddy.backend.dto.AnalyticsPageDto;
import localbuddy.backend.dto.AnalyticsTrafficSourceDto;
import localbuddy.backend.dto.TrackingEventRequest;
import localbuddy.backend.dto.TrackingEventResponse;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.model.entity.UserEvent;
import localbuddy.backend.model.entity.VisitorSession;
import localbuddy.backend.model.enums.TrackingEventType;
import localbuddy.backend.model.enums.UserRole;
import localbuddy.backend.repository.UserEventRepository;
import localbuddy.backend.repository.UserRepository;
import localbuddy.backend.repository.VisitorSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TrackingService {

    private static final ZoneId TRACKING_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final int MAX_METADATA_BYTES = 4000;
    private static final int MAX_METADATA_DEPTH = 3;
    private static final String DIRECT_TRAFFIC_SOURCE = "direct";
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final List<String> SENSITIVE_KEY_PARTS = List.of(
            "password",
            "token",
            "secret",
            "authorization",
            "cookie",
            "credential",
            "apikey",
            "api_key",
            "session"
    );

    private final VisitorSessionRepository visitorSessionRepository;
    private final UserEventRepository userEventRepository;
    private final UserRepository userRepository;

    @Transactional
    public TrackingEventResponse trackEvent(TrackingEventRequest request, HttpServletRequest httpRequest) {
        TrackingEventType eventType = parseEventType(request.getEventType());
        User currentUser = getCurrentUserOrNull();
        OffsetDateTime now = nowInTrackingZone();
        String pageUrl = trimToLength(request.getPageUrl(), 2000);
        if (shouldSkipTracking(currentUser, pageUrl, httpRequest)) {
            return TrackingEventResponse.builder()
                    .sessionKey(request.getSessionKey().trim())
                    .eventType(eventType.name())
                    .pageUrl(pageUrl)
                    .createdAt(now)
                    .build();
        }
        String referrer = trimToLength(httpRequest.getHeader("Referer"), 2000);
        String trafficSource = resolveTrafficSource(pageUrl, referrer);

        VisitorSession session = visitorSessionRepository.findBySessionKey(request.getSessionKey().trim())
                .orElseGet(() -> createSession(request.getSessionKey().trim(), httpRequest, pageUrl, referrer, trafficSource, now));
        if (currentUser != null) {
            session.setUser(currentUser);
        }
        session.setIpAddress(firstText(getClientIp(httpRequest), session.getIpAddress()));
        session.setUserAgent(firstText(trimToLength(httpRequest.getHeader("User-Agent"), 2000), session.getUserAgent()));
        session.setReferrer(firstText(referrer, session.getReferrer()));
        session.setTrafficSource(firstText(session.getTrafficSource(), trafficSource, DIRECT_TRAFFIC_SOURCE));
        session.setLandingPage(firstText(session.getLandingPage(), pageUrl));
        session.setDeviceType(resolveDeviceType(httpRequest.getHeader("User-Agent")));
        session.setLastVisitAt(now);
        visitorSessionRepository.save(session);

        Map<String, Object> safeMetadata = sanitizeMetadata(request.getMetadata());
        validateMetadataSize(safeMetadata);

        UserEvent event = new UserEvent();
        event.setSessionKey(session.getSessionKey());
        event.setUser(currentUser);
        event.setEventType(eventType.name());
        event.setPageUrl(pageUrl);
        event.setMetadata(safeMetadata.isEmpty() ? null : safeMetadata);
        event.setCreatedAt(now);

        UserEvent saved = userEventRepository.save(event);
        return TrackingEventResponse.builder()
                .id(saved.getId())
                .sessionKey(saved.getSessionKey())
                .eventType(saved.getEventType())
                .pageUrl(saved.getPageUrl())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public AnalyticsOverviewDto getOverview() {
        return AnalyticsOverviewDto.builder()
                .totalEvents(userEventRepository.count())
                .uniqueSessions(visitorSessionRepository.countDistinctSessionKeys())
                .loggedInUsers(visitorSessionRepository.countDistinctLoggedInUsers())
                .build();
    }

    @Transactional(readOnly = true)
    public List<AnalyticsPageDto> getPopularPages(int limit) {
        return userEventRepository.findPopularPages(PageRequest.of(0, normalizeLimit(limit)))
                .stream()
                .map(row -> AnalyticsPageDto.builder()
                        .pageUrl((String) row[0])
                        .views((Long) row[1])
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AnalyticsEventDto> getTopEvents(int limit) {
        return userEventRepository.findTopEvents(PageRequest.of(0, normalizeLimit(limit)))
                .stream()
                .map(row -> AnalyticsEventDto.builder()
                        .eventType((String) row[0])
                        .count((Long) row[1])
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AnalyticsTrafficSourceDto> getTrafficSources(int limit) {
        return visitorSessionRepository.findTopTrafficSources(PageRequest.of(0, normalizeLimit(limit)))
                .stream()
                .map(row -> AnalyticsTrafficSourceDto.builder()
                        .trafficSource((String) row[0])
                        .sessions((Long) row[1])
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AnalyticsActivityDto> getRecentActivity(int limit) {
        return userEventRepository.findRecentActivity(PageRequest.of(0, normalizeLimit(limit)))
                .stream()
                .map(row -> toActivityDto((UserEvent) row[0], (VisitorSession) row[1]))
                .toList();
    }

    private AnalyticsActivityDto toActivityDto(UserEvent event, VisitorSession session) {
        User user = event.getUser();
        return AnalyticsActivityDto.builder()
                .eventId(event.getId())
                .sessionKey(event.getSessionKey())
                .userId(user != null ? user.getId() : null)
                .userName(user != null ? user.getFullName() : null)
                .userEmail(user != null ? user.getEmail() : null)
                .userRole(user != null && user.getRole() != null ? user.getRole().name() : null)
                .eventType(event.getEventType())
                .pageUrl(event.getPageUrl())
                .metadata(event.getMetadata())
                .trafficSource(session != null ? session.getTrafficSource() : DIRECT_TRAFFIC_SOURCE)
                .referrer(session != null ? session.getReferrer() : null)
                .landingPage(session != null ? session.getLandingPage() : null)
                .createdAt(event.getCreatedAt())
                .build();
    }

    private VisitorSession createSession(
            String sessionKey,
            HttpServletRequest request,
            String pageUrl,
            String referrer,
            String trafficSource,
            OffsetDateTime now
    ) {
        VisitorSession session = new VisitorSession();
        session.setSessionKey(sessionKey);
        session.setTrafficSource(firstText(trafficSource, DIRECT_TRAFFIC_SOURCE));
        session.setIpAddress(getClientIp(request));
        session.setUserAgent(trimToLength(request.getHeader("User-Agent"), 2000));
        session.setReferrer(referrer);
        session.setLandingPage(pageUrl);
        session.setDeviceType(resolveDeviceType(request.getHeader("User-Agent")));
        session.setFirstVisitAt(now);
        session.setLastVisitAt(now);
        return session;
    }

    private TrackingEventType parseEventType(String eventType) {
        if (!StringUtils.hasText(eventType)) {
            throw new IllegalArgumentException("Event type is required.");
        }
        try {
            return TrackingEventType.valueOf(eventType.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unsupported tracking event type.");
        }
    }

    private boolean shouldSkipTracking(User currentUser, String pageUrl, HttpServletRequest request) {
        if (currentUser != null && currentUser.getRole() == UserRole.ADMIN) {
            return true;
        }
        if (StringUtils.hasText(pageUrl) && pageUrl.startsWith("/admin")) {
            return true;
        }
        return isLocalhost(request.getHeader("Host"))
                || isLocalhost(request.getHeader("Origin"))
                || isLocalhost(request.getHeader("Referer"));
    }

    private User getCurrentUserOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        Object credentials = authentication.getCredentials();
        if (!(credentials instanceof String userId)) {
            return null;
        }
        try {
            UUID id = UUID.fromString(userId);
            return userRepository.findById(id).orElse(null);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private Map<String, Object> sanitizeMetadata(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return Map.of();
        }
        return sanitizeObjectMap(metadata, 0);
    }

    private Map<String, Object> sanitizeObjectMap(Map<String, Object> source, int depth) {
        if (depth >= MAX_METADATA_DEPTH) {
            return Map.of();
        }
        Map<String, Object> safe = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : source.entrySet()) {
            String key = entry.getKey();
            if (!StringUtils.hasText(key) || isSensitiveKey(key)) {
                continue;
            }
            Object value = sanitizeValue(entry.getValue(), depth + 1);
            if (value != null) {
                safe.put(trimToLength(key, 100), value);
            }
            if (safe.size() >= 30) {
                break;
            }
        }
        return safe;
    }

    private Object sanitizeValue(Object value, int depth) {
        if (value == null) {
            return null;
        }
        if (value instanceof String text) {
            return trimToLength(text, 500);
        }
        if (value instanceof Number || value instanceof Boolean) {
            return value;
        }
        if (value instanceof Map<?, ?> mapValue) {
            Map<String, Object> nested = new LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : mapValue.entrySet()) {
                if (entry.getKey() instanceof String key) {
                    nested.put(key, entry.getValue());
                }
            }
            return sanitizeObjectMap(nested, depth);
        }
        if (value instanceof Iterable<?> iterable) {
            return sanitizeIterable(iterable, depth);
        }
        return trimToLength(String.valueOf(value), 500);
    }

    private List<Object> sanitizeIterable(Iterable<?> iterable, int depth) {
        java.util.ArrayList<Object> safe = new java.util.ArrayList<>();
        for (Object item : iterable) {
            Object sanitized = sanitizeValue(item, depth + 1);
            if (sanitized != null) {
                safe.add(sanitized);
            }
            if (safe.size() >= 20) {
                break;
            }
        }
        return safe;
    }

    private void validateMetadataSize(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return;
        }
        try {
            int bytes = OBJECT_MAPPER.writeValueAsBytes(metadata).length;
            if (bytes > MAX_METADATA_BYTES) {
                throw new IllegalArgumentException("Tracking metadata is too large.");
            }
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Tracking metadata is invalid.");
        }
    }

    private boolean isSensitiveKey(String key) {
        String normalized = key.toLowerCase(Locale.ROOT);
        return SENSITIVE_KEY_PARTS.stream().anyMatch(normalized::contains);
    }

    private String getClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwardedFor)) {
            return trimToLength(forwardedFor.split(",")[0].trim(), 100);
        }
        return trimToLength(request.getRemoteAddr(), 100);
    }

    private String resolveDeviceType(String userAgent) {
        if (!StringUtils.hasText(userAgent)) {
            return "unknown";
        }
        String normalized = userAgent.toLowerCase(Locale.ROOT);
        if (normalized.contains("mobile") || normalized.contains("android") || normalized.contains("iphone")) {
            return "mobile";
        }
        if (normalized.contains("ipad") || normalized.contains("tablet")) {
            return "tablet";
        }
        return "desktop";
    }

    private String resolveTrafficSource(String pageUrl, String referrer) {
        String utmSource = extractQueryParam(pageUrl, "utm_source");
        if (StringUtils.hasText(utmSource)) {
            return normalizeTrafficSource(utmSource);
        }
        if (StringUtils.hasText(referrer)) {
            return normalizeTrafficSource(referrer);
        }
        return DIRECT_TRAFFIC_SOURCE;
    }

    private boolean isLocalhost(String value) {
        if (!StringUtils.hasText(value)) {
            return false;
        }
        String normalized = value.toLowerCase(Locale.ROOT).trim();
        String host = extractHost(normalized);
        if (!StringUtils.hasText(host)) {
            host = normalized;
        }
        if (host.startsWith("[") && host.contains("]")) {
            host = host.substring(0, host.indexOf(']') + 1);
        } else {
            int portSeparator = host.indexOf(':');
            if (portSeparator > 0) {
                host = host.substring(0, portSeparator);
            }
        }
        return host.equals("localhost")
                || host.equals("127.0.0.1")
                || host.equals("0.0.0.0")
                || host.equals("::1")
                || host.equals("[::1]");
    }

    private String extractQueryParam(String pageUrl, String paramName) {
        if (!StringUtils.hasText(pageUrl)) {
            return null;
        }
        String query = null;
        try {
            query = URI.create(pageUrl).getRawQuery();
        } catch (IllegalArgumentException ignored) {
            int queryStart = pageUrl.indexOf('?');
            if (queryStart >= 0 && queryStart < pageUrl.length() - 1) {
                query = pageUrl.substring(queryStart + 1);
            }
        }
        if (!StringUtils.hasText(query)) {
            return null;
        }
        for (String pair : query.split("&")) {
            int separator = pair.indexOf('=');
            String key = separator >= 0 ? pair.substring(0, separator) : pair;
            if (!paramName.equalsIgnoreCase(urlDecode(key))) {
                continue;
            }
            String value = separator >= 0 ? pair.substring(separator + 1) : "";
            return urlDecode(value);
        }
        return null;
    }

    private String normalizeTrafficSource(String rawSource) {
        String normalized = rawSource.toLowerCase(Locale.ROOT).trim();
        if (normalized.contains("facebook") || normalized.equals("fb")) {
            return "facebook";
        }
        if (normalized.contains("tiktok")) {
            return "tiktok";
        }
        if (normalized.contains("google")) {
            return "google";
        }
        if (normalized.contains("reddit")) {
            return "reddit";
        }
        if (normalized.contains("discord")) {
            return "discord";
        }
        if (normalized.contains("instagram") || normalized.equals("ig")) {
            return "instagram";
        }
        if (normalized.equals("direct")) {
            return DIRECT_TRAFFIC_SOURCE;
        }

        String host = extractHost(normalized);
        if (StringUtils.hasText(host)) {
            return trimToLength(host.replaceFirst("^www\\.", ""), 100);
        }
        return trimToLength(normalized.replaceAll("[^a-z0-9_.-]", "_"), 100);
    }

    private String extractHost(String value) {
        try {
            URI uri = URI.create(value);
            return uri.getHost();
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    private String urlDecode(String value) {
        try {
            return URLDecoder.decode(value, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            return value;
        }
    }

    private int normalizeLimit(int limit) {
        if (limit < 1) {
            return 10;
        }
        return Math.min(limit, 100);
    }

    private OffsetDateTime nowInTrackingZone() {
        return OffsetDateTime.now(TRACKING_ZONE);
    }

    private String firstText(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return null;
    }

    private String trimToLength(String value, int maxLength) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength);
    }
}
