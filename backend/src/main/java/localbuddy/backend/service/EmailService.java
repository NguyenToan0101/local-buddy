package localbuddy.backend.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

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

            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true);

            mailSender.send(message);
            System.out.println("====== [EMAIL SERVICE] Email successfully sent to " + toEmail + " ======");
        } catch (Exception e) {
            System.err.println("====== [EMAIL SERVICE] FAILED to send email to " + toEmail + " ======");
            System.err.println("Error details: " + e.getMessage());
        } finally {
            // Bulletproof fallback: Always print the OTP to the console so local development never breaks
            System.out.println("\n========================================================");
            System.out.println("   [LOCAL DEVELOPMENT OTP FALLBACK]");
            System.out.println("   Email: " + toEmail);
            System.out.println("   OTP Code: " + otp);
            System.out.println("========================================================\n");
        }
    }
}
