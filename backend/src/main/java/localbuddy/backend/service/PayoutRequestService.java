package localbuddy.backend.service;

import localbuddy.backend.dto.CreatePayoutRequestDto;
import localbuddy.backend.dto.PayoutRequestDto;
import localbuddy.backend.model.entity.PayoutRequest;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.model.enums.PayoutStatus;
import localbuddy.backend.repository.PayoutRequestRepository;
import localbuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PayoutRequestService {

    private final PayoutRequestRepository payoutRequestRepository;
    private final UserRepository userRepository;
    private final EarningsService earningsService;

    /**
     * Buddy submits a withdrawal request.
     * Validates that requested amount does not exceed available balance.
     */
    @Transactional
    public PayoutRequestDto createRequest(UUID buddyId, CreatePayoutRequestDto dto) {
        User buddy = userRepository.findById(buddyId)
                .orElseThrow(() -> new IllegalArgumentException("Buddy not found: " + buddyId));

        BigDecimal availableBalance = earningsService.getAvailableBalance(buddyId);
        if (dto.getAmount() == null || dto.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Withdrawal amount must be positive.");
        }
        if (dto.getAmount().compareTo(availableBalance) > 0) {
            throw new IllegalArgumentException(
                    String.format("Insufficient balance. Available: $%.2f, Requested: $%.2f",
                            availableBalance, dto.getAmount()));
        }

        PayoutRequest request = new PayoutRequest();
        request.setBuddy(buddy);
        request.setAmount(dto.getAmount());
        request.setTaxRate(new BigDecimal("10.00"));
        request.setStatus(PayoutStatus.PENDING);
        request.setBankName(dto.getBankName());
        String accountName = dto.getBankAccountName();
        if (accountName == null || accountName.isBlank()) {
            accountName = buddy.getFullName() != null && !buddy.getFullName().isBlank()
                    ? buddy.getFullName()
                    : "Buddy";
        }
        request.setBankAccountName(accountName);
        request.setBankAccountNumber(dto.getBankAccountNumber());
        request.setRequestedAt(OffsetDateTime.now());

        PayoutRequest saved = payoutRequestRepository.save(request);
        return mapToDto(saved);
    }

    /**
     * Admin: get all payout requests.
     */
    @Transactional(readOnly = true)
    public List<PayoutRequestDto> getAllRequests() {
        return payoutRequestRepository.findAllByOrderByRequestedAtDesc()
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    /**
     * Admin: get only PENDING payout requests.
     */
    @Transactional(readOnly = true)
    public List<PayoutRequestDto> getPendingRequests() {
        return payoutRequestRepository.findByStatusOrderByRequestedAtDesc(PayoutStatus.PENDING)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    /**
     * Admin approves a withdrawal request:
     * 1. Marks the payout request as PAID.
     * 2. Creates a PAYOUT EarningsTransaction to deduct from buddy's wallet.
     */
    @Transactional
    public PayoutRequestDto approveRequest(UUID requestId) {
        PayoutRequest request = payoutRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Payout request not found: " + requestId));

        if (request.getStatus() != PayoutStatus.PENDING) {
            throw new IllegalStateException("Request is already " + request.getStatus());
        }

        request.setStatus(PayoutStatus.PAID);
        request.setProcessedAt(OffsetDateTime.now());
        payoutRequestRepository.save(request);

        String payoutDescription = String.format("Payout approved to %s (%s)",
                request.getBankName(), request.getBankAccountNumber());
        earningsService.createPayoutTransaction(
                request.getBuddy().getId(),
                request.getAmount(),
                payoutDescription
        );

        return mapToDto(request);
    }

    /**
     * Admin rejects a withdrawal request.
     */
    @Transactional
    public PayoutRequestDto rejectRequest(UUID requestId, String reason) {
        PayoutRequest request = payoutRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Payout request not found: " + requestId));

        if (request.getStatus() != PayoutStatus.PENDING) {
            throw new IllegalStateException("Request is already " + request.getStatus());
        }

        request.setStatus(PayoutStatus.REJECTED);
        request.setProcessedAt(OffsetDateTime.now());
        // Store rejection reason in the bank name field as a note (or we can add a field later)
        // For now we add it as description in a separate field; we'll use a transient approach
        payoutRequestRepository.save(request);

        return mapToDto(request);
    }

    private PayoutRequestDto mapToDto(PayoutRequest request) {
        User buddy = request.getBuddy();
        String buddyName = buddy != null ? buddy.getFullName() : null;
        String buddyImage = buddy != null ? buddy.getAvatarUrl() : null;

        return PayoutRequestDto.builder()
                .id(request.getId())
                .buddyId(buddy != null ? buddy.getId() : null)
                .buddyName(buddyName)
                .buddyImage(buddyImage)
                .amount(request.getAmount())
                .taxRate(request.getTaxRate())
                .bankName(request.getBankName())
                .bankAccountName(request.getBankAccountName())
                .bankAccountNumber(request.getBankAccountNumber())
                .status(request.getStatus() != null ? request.getStatus().name() : null)
                .requestedAt(request.getRequestedAt())
                .processedAt(request.getProcessedAt())
                .build();
    }
}
