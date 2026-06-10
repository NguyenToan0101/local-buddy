package localbuddy.backend.service.verification;

import java.util.UUID;

public record DuplicateResult(boolean duplicateDetected, UUID duplicateUserId, String reason) {
}
