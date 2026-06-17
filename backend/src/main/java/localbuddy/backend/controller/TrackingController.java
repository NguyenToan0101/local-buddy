package localbuddy.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import localbuddy.backend.dto.TrackingEventRequest;
import localbuddy.backend.dto.TrackingEventResponse;
import localbuddy.backend.service.TrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tracking")
@RequiredArgsConstructor
public class TrackingController {

    private final TrackingService trackingService;

    @PostMapping("/event")
    public ResponseEntity<TrackingEventResponse> trackEvent(
            @Valid @RequestBody TrackingEventRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(trackingService.trackEvent(request, httpRequest));
    }
}
