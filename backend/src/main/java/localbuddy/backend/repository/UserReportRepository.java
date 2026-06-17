package localbuddy.backend.repository;

import localbuddy.backend.model.entity.UserReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserReportRepository extends JpaRepository<UserReport, UUID> {
}
