package localbuddy.backend.service;

import localbuddy.backend.repository.PendingRegistrationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class PendingRegistrationCleanupService {

    private final PendingRegistrationRepository pendingRegistrationRepository;

    @Scheduled(fixedDelayString = "${app.registration.cleanup-delay-ms:900000}")
    @Transactional
    public void cleanupExpiredPendingRegistrations() {
        long deleted = pendingRegistrationRepository.deleteByExpiresAtBefore(OffsetDateTime.now());
        if (deleted > 0) {
            log.info("Deleted {} expired pending registrations.", deleted);
        }
    }
}
