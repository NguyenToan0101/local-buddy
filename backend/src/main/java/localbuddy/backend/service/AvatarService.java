package localbuddy.backend.service;

import localbuddy.backend.model.entity.User;
import org.springframework.util.StringUtils;

public final class AvatarService {

    private AvatarService() {
    }

    public static String getDisplayAvatarUrl(User user) {
        if (user == null) {
            return null;
        }
        if (StringUtils.hasText(user.getAvatarUrl())) {
            return user.getAvatarUrl();
        }
        return user.getGoogleAvatarUrl();
    }
}
