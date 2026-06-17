package localbuddy.backend.service;

import localbuddy.backend.dto.UserReportDto;
import localbuddy.backend.dto.UserReportRequest;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.model.entity.UserReport;
import localbuddy.backend.repository.UserReportRepository;
import localbuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserReportService {

    private static final ZoneId REPORT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final UserRepository userRepository;
    private final UserReportRepository userReportRepository;

    @Transactional
    public UserReportDto createReport(UUID reporterId, UserReportRequest request) {
        if (reporterId.equals(request.getReportedUserId())) {
            throw new IllegalArgumentException("You cannot report yourself.");
        }

        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new IllegalArgumentException("Reporter not found."));
        User reportedUser = userRepository.findById(request.getReportedUserId())
                .orElseThrow(() -> new IllegalArgumentException("Reported user not found."));

        UserReport report = new UserReport();
        report.setReporter(reporter);
        report.setReportedUser(reportedUser);
        report.setReason(request.getReason());
        report.setDescription(request.getDescription());
        report.setEvidenceUrl(request.getEvidenceUrl());
        report.setCreatedAt(OffsetDateTime.now(REPORT_ZONE));

        return mapToDto(userReportRepository.save(report));
    }

    private UserReportDto mapToDto(UserReport report) {
        return UserReportDto.builder()
                .id(report.getId())
                .reportedUserId(report.getReportedUser().getId())
                .reporterId(report.getReporter().getId())
                .reason(report.getReason())
                .description(report.getDescription())
                .evidenceUrl(report.getEvidenceUrl())
                .createdAt(report.getCreatedAt())
                .build();
    }
}
