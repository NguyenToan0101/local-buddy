package localbuddy.backend.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${app.email.log-sensitive-fallback:false}")
    private boolean logSensitiveFallback;

    public void sendOtpEmail(String toEmail, String otp) {
        String subject = "Local Buddy - Verify Your Email";
        String body = "<h3>Welcome to Local Buddy!</h3>"
                + "<p>Please use the following 6-digit One-Time Password (OTP) to complete your registration:</p>"
                + "<h2 style='color: #FF7E4B; letter-spacing: 4px;'>" + otp + "</h2>"
                + "<p>This code is valid for 5 minutes.</p>"
                + "<br/>"
                + "<p>Safe travels,<br/>The Local Buddy Team</p>";

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            if (fromEmail != null && !fromEmail.isBlank()) {
                helper.setFrom(fromEmail);
            }
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true);

            mailSender.send(message);
            System.out.println("====== [EMAIL SERVICE] Email successfully sent to " + toEmail + " ======");
        } catch (Exception e) {
            System.err.println("====== [EMAIL SERVICE] FAILED to send email to " + toEmail + " ======");
            System.err.println("Error details: " + e.getMessage());
            throw new MailSendException("Could not send OTP email. Please check SMTP configuration.", e);
        } finally {
            if (logSensitiveFallback) {
                System.out.println("\n========================================================");
                System.out.println("   [LOCAL DEVELOPMENT OTP FALLBACK]");
                System.out.println("   Email: " + toEmail);
                System.out.println("   OTP Code: " + otp);
                System.out.println("========================================================\n");
            }
        }
    }

    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        String subject = "Local Buddy - Reset Your Password";
        String body = "<h3>Reset your Local Buddy password</h3>"
                + "<p>We received a request to reset the password for your account.</p>"
                + "<p><a href=\"" + resetLink + "\" style=\"display:inline-block;background:#FF7E4B;color:#ffffff;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:700;\">Reset Password</a></p>"
                + "<p>This link is valid for 30 minutes. If you did not request it, you can ignore this email.</p>"
                + "<br/>"
                + "<p>Safe travels,<br/>The Local Buddy Team</p>";

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            if (fromEmail != null && !fromEmail.isBlank()) {
                helper.setFrom(fromEmail);
            }
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true);

            mailSender.send(message);
            System.out.println("====== [EMAIL SERVICE] Password reset email successfully sent to " + toEmail + " ======");
        } catch (Exception e) {
            System.err.println("====== [EMAIL SERVICE] FAILED to send password reset email to " + toEmail + " ======");
            System.err.println("Error details: " + e.getMessage());
        } finally {
            if (logSensitiveFallback) {
                System.out.println("\n========================================================");
                System.out.println("   [LOCAL DEVELOPMENT PASSWORD RESET FALLBACK]");
                System.out.println("   Email: " + toEmail);
                System.out.println("   Reset Link: " + resetLink);
                System.out.println("========================================================\n");
            }
        }
    }
}
