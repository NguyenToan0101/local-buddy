package localbuddy.backend.controller;

import jakarta.validation.Valid;
import localbuddy.backend.dto.BookingDto;
import localbuddy.backend.dto.BookingRequest;
import localbuddy.backend.service.BookingService;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @GetMapping
    public ResponseEntity<Page<BookingDto>> getBookings(Pageable pageable) {
        return ResponseEntity.ok(bookingService.getBookings(getCurrentUserId(), pageable));
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<BookingDto> getBooking(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.getBooking(getCurrentUserId(), bookingId));
    }

    @PostMapping
    public ResponseEntity<BookingDto> createBooking(@Valid @RequestBody BookingRequest request) {
        return ResponseEntity.ok(bookingService.createBooking(getCurrentUserId(), request));
    }

    @PatchMapping("/{bookingId}/status")
    public ResponseEntity<BookingDto> updateStatus(
            @PathVariable UUID bookingId,
            @RequestBody StatusRequest request
    ) {
        return ResponseEntity.ok(bookingService.updateStatus(getCurrentUserId(), bookingId, request.getStatus()));
    }

    @PatchMapping("/{bookingId}/meetup-status")
    public ResponseEntity<BookingDto> updateMeetupStatus(
            @PathVariable UUID bookingId,
            @RequestBody StatusRequest request
    ) {
        return ResponseEntity.ok(bookingService.updateMeetupStatus(getCurrentUserId(), bookingId, request.getStatus()));
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

    @Getter
    @Setter
    public static class StatusRequest {
        private String status;
    }
}
