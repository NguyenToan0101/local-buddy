package localbuddy.backend.service;

import localbuddy.backend.dto.EarningsSummaryDto;
import localbuddy.backend.dto.EarningsTransactionDto;
import localbuddy.backend.model.entity.Booking;
import localbuddy.backend.model.entity.EarningsTransaction;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.model.enums.TransactionType;
import localbuddy.backend.repository.EarningsTransactionRepository;
import localbuddy.backend.repository.UserRepository;
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
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<EarningsTransactionDto> getTransactions(UUID currentUserId) {
        return earningsTransactionRepository.findByBuddyIdOrderByCreatedAtDesc(currentUserId)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EarningsTransactionDto> getAllTransactions() {
        return earningsTransactionRepository.findAllByOrderByCreatedAtDesc()
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

    /**
     * Creates an INCOME earnings transaction for the buddy after a successful traveler payment.
     */
    @Transactional
    public EarningsTransaction createIncomeTransaction(UUID buddyId, Booking booking, BigDecimal amount, String description) {
        User buddy = userRepository.findById(buddyId)
                .orElseThrow(() -> new IllegalArgumentException("Buddy not found: " + buddyId));

        EarningsTransaction tx = new EarningsTransaction();
        tx.setBuddy(buddy);
        tx.setBooking(booking);
        tx.setTransactionType(TransactionType.INCOME);
        tx.setAmount(amount);
        tx.setDescription(description);
        tx.setCreatedAt(OffsetDateTime.now());

        return earningsTransactionRepository.save(tx);
    }

    /**
     * Creates a PAYOUT earnings transaction for the buddy when a withdrawal request is approved.
     * Amount is stored as positive in DB (amount_check constraint); API DTO exposes it as negative.
     */
    @Transactional
    public EarningsTransaction createPayoutTransaction(UUID buddyId, BigDecimal amount, String description) {
        User buddy = userRepository.findById(buddyId)
                .orElseThrow(() -> new IllegalArgumentException("Buddy not found: " + buddyId));

        EarningsTransaction tx = new EarningsTransaction();
        tx.setBuddy(buddy);
        tx.setTransactionType(TransactionType.PAYOUT);
        tx.setAmount(amount.abs());
        tx.setDescription(description);
        tx.setCreatedAt(OffsetDateTime.now());

        return earningsTransactionRepository.save(tx);
    }

    /**
     * Calculates available balance for a buddy (total INCOME minus absolute PAYOUT amounts).
     */
    @Transactional(readOnly = true)
    public BigDecimal getAvailableBalance(UUID buddyId) {
        List<EarningsTransaction> transactions = earningsTransactionRepository.findByBuddyIdOrderByCreatedAtDesc(buddyId);
        BigDecimal income = transactions.stream()
                .filter(t -> t.getTransactionType() == TransactionType.INCOME)
                .map(EarningsTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal payouts = transactions.stream()
                .filter(t -> t.getTransactionType() == TransactionType.PAYOUT)
                .map(t -> t.getAmount().abs())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return income.subtract(payouts);
    }

    private EarningsTransactionDto mapToDto(EarningsTransaction transaction) {
        Booking booking = transaction.getBooking();
        OffsetDateTime createdAt = transaction.getCreatedAt() != null
                ? transaction.getCreatedAt().atZoneSameInstant(EARNINGS_ZONE).toOffsetDateTime()
                : null;
        boolean income = transaction.getTransactionType() == TransactionType.INCOME;
        BigDecimal signedAmount = income
                ? transaction.getAmount()
                : transaction.getAmount().abs().negate();

        return EarningsTransactionDto.builder()
                .id(transaction.getId())
                .buddyId(transaction.getBuddy().getId())
                .bookingId(booking != null ? booking.getId() : null)
                .type(income ? "income" : "payout")
                .amount(signedAmount)
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
