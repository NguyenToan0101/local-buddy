package localbuddy.backend.controller;

import jakarta.validation.Valid;
import localbuddy.backend.dto.BookingDto;
import localbuddy.backend.dto.BookingItineraryRequest;
import localbuddy.backend.dto.BookingRequest;
import localbuddy.backend.dto.CancellationRequest;
import localbuddy.backend.dto.QrTokenResponse;
import localbuddy.backend.dto.ReviewDto;
import localbuddy.backend.dto.ReviewRequest;
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

    @PatchMapping("/{bookingId}/itinerary")
    public ResponseEntity<BookingDto> updateItinerary(
            @PathVariable UUID bookingId,
            @Valid @RequestBody BookingItineraryRequest request
    ) {
        return ResponseEntity.ok(bookingService.updateItinerary(getCurrentUserId(), bookingId, request));
    }

    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<BookingDto> cancel(
            @PathVariable UUID bookingId,
            @Valid @RequestBody CancellationRequest request
    ) {
        return ResponseEntity.ok(bookingService.cancel(getCurrentUserId(), bookingId, request));
    }

    @PostMapping("/{bookingId}/traveler-arrived")
    public ResponseEntity<BookingDto> markTravelerArrived(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.markTravelerArrived(getCurrentUserId(), bookingId));
    }

    @PostMapping("/{bookingId}/buddy-arrived")
    public ResponseEntity<BookingDto> markBuddyArrived(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.markBuddyArrived(getCurrentUserId(), bookingId));
    }

    @GetMapping("/{bookingId}/qr-token")
    public ResponseEntity<QrTokenResponse> getQrToken(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.getQrToken(getCurrentUserId(), bookingId));
    }

    @PostMapping("/{bookingId}/start-with-qr")
    public ResponseEntity<BookingDto> startWithQr(
            @PathVariable UUID bookingId,
            @RequestBody QrStartRequest request
    ) {
        return ResponseEntity.ok(bookingService.startWithQr(getCurrentUserId(), bookingId, request.getQrToken()));
    }

    @PostMapping("/{bookingId}/complete")
    public ResponseEntity<BookingDto> complete(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.complete(getCurrentUserId(), bookingId));
    }

    @PostMapping("/{bookingId}/reviews")
    public ResponseEntity<ReviewDto> createReview(
            @PathVariable UUID bookingId,
            @RequestBody ReviewRequest request
    ) {
        return ResponseEntity.ok(bookingService.createReview(getCurrentUserId(), bookingId, request));
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

    @Getter
    @Setter
    public static class QrStartRequest {
        private String qrToken;
    }
}
