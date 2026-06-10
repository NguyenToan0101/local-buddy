package localbuddy.backend.service.verification;

import localbuddy.backend.model.entity.BuddyProfile;
import localbuddy.backend.repository.BuddyProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DuplicateIdentityService {

    private final BuddyProfileRepository buddyProfileRepository;

    public DuplicateResult check(UUID currentUserId, String idNumber) {
        if (!StringUtils.hasText(idNumber)) {
            return new DuplicateResult(false, null, null);
        }
        return buddyProfileRepository.findFirstByExtractedIdNumberAndUser_IdNot(idNumber, currentUserId)
                .map(BuddyProfile::getUser)
                .map(user -> new DuplicateResult(true, user.getId(), "CCCD number is already used by another account."))
                .orElseGet(() -> new DuplicateResult(false, null, null));
    }
}
