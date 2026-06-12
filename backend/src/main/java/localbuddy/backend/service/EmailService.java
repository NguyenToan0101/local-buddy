package localbuddy.backend.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final RestClient resendClient = RestClient.create("https://api.resend.com");

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${app.email.from:${spring.mail.username:}}")
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
            sendEmail(toEmail, subject, body);
            System.out.println("====== [EMAIL SERVICE] Email successfully sent to " + toEmail + " ======");
        } catch (Exception e) {
            System.err.println("====== [EMAIL SERVICE] FAILED to send email to " + toEmail + " ======");
            System.err.println("Error details: " + e.getMessage());
            throw new MailSendException("Could not send OTP email. Please check email provider configuration.", e);
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
            sendEmail(toEmail, subject, body);
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

    private void sendEmail(String toEmail, String subject, String htmlBody) {
        if (resendApiKey != null && !resendApiKey.isBlank()) {
            sendViaResend(toEmail, subject, htmlBody);
            return;
        }
        sendViaSmtp(toEmail, subject, htmlBody);
    }

    private void sendViaResend(String toEmail, String subject, String htmlBody) {
        String from = requireFromEmail();
        try {
            resendClient.post()
                    .uri("/emails")
                    .header("Authorization", "Bearer " + resendApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "from", from,
                            "to", List.of(toEmail),
                            "subject", subject,
                            "html", htmlBody
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            throw new MailSendException("Resend API email delivery failed.", e);
        }
    }

    private void sendViaSmtp(String toEmail, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            if (fromEmail != null && !fromEmail.isBlank()) {
                helper.setFrom(fromEmail);
            }
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(message);
        } catch (Exception e) {
            throw new MailSendException("SMTP email delivery failed.", e);
        }
    }

    private String requireFromEmail() {
        if (fromEmail == null || fromEmail.isBlank()) {
            throw new MailSendException("Email sender is not configured. Set EMAIL_FROM.");
        }
        return fromEmail;
    }
}
