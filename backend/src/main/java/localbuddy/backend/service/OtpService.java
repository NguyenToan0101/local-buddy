package localbuddy.backend.service;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private final ConcurrentHashMap<String, OtpData> otpCache = new ConcurrentHashMap<>();
    private final Random random = new Random();

    @Getter
    @AllArgsConstructor
    private static class OtpData {
        private final String otp;
        private final OffsetDateTime expiryTime;
    }

    public String generateOtp(String email) {
        String key = email.trim().toLowerCase();
        // Generate a 6-digit OTP
        int number = 100000 + random.nextInt(900000);
        String otp = String.valueOf(number);

        // Store OTP with 5 minutes expiration
        OffsetDateTime expiry = OffsetDateTime.now().plusMinutes(5);
        otpCache.put(key, new OtpData(otp, expiry));

        return otp;
    }

    public boolean validateOtp(String email, String otp) {
        String key = email.trim().toLowerCase();
        OtpData otpData = otpCache.get(key);

        if (otpData == null) {
            return false;
        }

        if (otpData.getExpiryTime().isBefore(OffsetDateTime.now())) {
            otpCache.remove(key); // Expired
            return false;
        }

        return otpData.getOtp().equals(otp.trim());
    }

    public void clearOtp(String email) {
        String key = email.trim().toLowerCase();
        otpCache.remove(key);
    }
}
