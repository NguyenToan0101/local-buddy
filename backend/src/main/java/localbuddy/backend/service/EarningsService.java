package localbuddy.backend.service;

import localbuddy.backend.dto.EarningsSummaryDto;
import localbuddy.backend.dto.EarningsTransactionDto;
import localbuddy.backend.model.entity.Booking;
import localbuddy.backend.model.entity.EarningsTransaction;
import localbuddy.backend.model.enums.TransactionType;
import localbuddy.backend.repository.EarningsTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EarningsService {

    private static final ZoneId EARNINGS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter SHORT_DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM dd");
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private final EarningsTransactionRepository earningsTransactionRepository;

    @Transactional(readOnly = true)
    public List<EarningsTransactionDto> getTransactions(UUID currentUserId) {
        return earningsTransactionRepository.findByBuddyIdOrderByCreatedAtDesc(currentUserId)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public EarningsSummaryDto getSummary(UUID currentUserId) {
        List<EarningsTransaction> transactions = earningsTransactionRepository.findByBuddyIdOrderByCreatedAtDesc(currentUserId);
        BigDecimal lifetimeEarnings = transactions.stream()
                .filter(transaction -> transaction.getTransactionType() == TransactionType.INCOME)
                .map(EarningsTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPayouts = transactions.stream()
                .filter(transaction -> transaction.getTransactionType() == TransactionType.PAYOUT)
                .map(transaction -> transaction.getAmount().abs())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return EarningsSummaryDto.builder()
                .balance(lifetimeEarnings.subtract(totalPayouts))
                .lifetimeEarnings(lifetimeEarnings)
                .totalPayouts(totalPayouts)
                .transactionCount(transactions.size())
                .build();
    }

    private EarningsTransactionDto mapToDto(EarningsTransaction transaction) {
        Booking booking = transaction.getBooking();
        OffsetDateTime createdAt = transaction.getCreatedAt() != null
                ? transaction.getCreatedAt().atZoneSameInstant(EARNINGS_ZONE).toOffsetDateTime()
                : null;
        boolean income = transaction.getTransactionType() == TransactionType.INCOME;

        return EarningsTransactionDto.builder()
                .id(transaction.getId())
                .buddyId(transaction.getBuddy().getId())
                .bookingId(booking != null ? booking.getId() : null)
                .type(income ? "income" : "payout")
                .amount(transaction.getAmount())
                .description(transaction.getDescription())
                .activity(booking != null ? booking.getTitle() : transaction.getDescription())
                .client(booking != null && booking.getTraveler() != null ? booking.getTraveler().getFullName() : null)
                .target(income ? null : firstText(transaction.getDescription(), "Payout"))
                .date(createdAt != null ? createdAt.format(SHORT_DATE_FORMATTER) : "")
                .createdAt(createdAt != null ? createdAt.format(ISO_FORMATTER) : "")
                .build();
    }

    private String firstText(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }
}
