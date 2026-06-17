package localbuddy.backend.service;

import localbuddy.backend.model.entity.Booking;
import localbuddy.backend.model.enums.BookingStatus;
import localbuddy.backend.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class PendingBookingCleanupService {

    private static final ZoneId BOOKING_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final BookingRepository bookingRepository;

    @Scheduled(fixedDelayString = "${app.booking.pending-cleanup-delay-ms:900000}")
    @Transactional
    public void cleanupExpiredPendingBookings() {
        OffsetDateTime now = OffsetDateTime.now(BOOKING_ZONE);
        List<Booking> expiredBookings = bookingRepository.findByStatusAndStartTimeBefore(BookingStatus.PENDING, now);
        if (expiredBookings.isEmpty()) {
            return;
        }

        bookingRepository.deleteAllInBatch(expiredBookings);
        log.info("Deleted {} expired pending bookings.", expiredBookings.size());
    }
}
