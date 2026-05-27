package localbuddy.backend.service;

import localbuddy.backend.dto.AvailabilitySlotDto;
import localbuddy.backend.model.entity.AvailabilitySlot;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.repository.AvailabilitySlotRepository;
import localbuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvailabilitySlotService {

    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy", Locale.US);
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("hh:mm a", Locale.US);
    private static final ZoneOffset VIETNAM_OFFSET = ZoneOffset.ofHours(7);

    @Transactional(readOnly = true)
    public List<AvailabilitySlotDto> getAvailabilitiesByBuddy(UUID buddyId) {
        return availabilitySlotRepository.findByBuddyId(buddyId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AvailabilitySlotDto addAvailability(UUID buddyId, AvailabilitySlotDto dto) {
        User buddy = userRepository.findById(buddyId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + buddyId));

        OffsetDateTime startTime = parseToOffsetDateTime(dto.getDate(), dto.getTime());
        OffsetDateTime endTime = startTime.plusHours(2);

        // Check for duplicates
        if (availabilitySlotRepository.findByBuddyIdAndStartTime(buddyId, startTime).isPresent()) {
            throw new IllegalArgumentException("Slot already exists for this date and time!");
        }

        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setBuddy(buddy);
        slot.setStartTime(startTime);
        slot.setEndTime(endTime);
        slot.setCreatedAt(OffsetDateTime.now());

        AvailabilitySlot saved = availabilitySlotRepository.save(slot);
        return mapToDto(saved);
    }

    @Transactional
    public List<AvailabilitySlotDto> addAvailabilitiesBulk(UUID buddyId, List<AvailabilitySlotDto> dtos) {
        User buddy = userRepository.findById(buddyId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + buddyId));

        List<AvailabilitySlot> toSave = new ArrayList<>();
        for (AvailabilitySlotDto dto : dtos) {
            OffsetDateTime startTime = parseToOffsetDateTime(dto.getDate(), dto.getTime());
            OffsetDateTime endTime = startTime.plusHours(2);

            // Skip duplicates
            if (availabilitySlotRepository.findByBuddyIdAndStartTime(buddyId, startTime).isPresent()) {
                continue;
            }

            AvailabilitySlot slot = new AvailabilitySlot();
            slot.setBuddy(buddy);
            slot.setStartTime(startTime);
            slot.setEndTime(endTime);
            slot.setCreatedAt(OffsetDateTime.now());
            toSave.add(slot);
        }

        List<AvailabilitySlot> saved = availabilitySlotRepository.saveAll(toSave);
        return saved.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public void deleteAvailability(UUID buddyId, UUID slotId) {
        AvailabilitySlot slot = availabilitySlotRepository.findById(slotId)
                .orElseThrow(() -> new IllegalArgumentException("Availability slot not found with ID: " + slotId));

        if (!slot.getBuddy().getId().equals(buddyId)) {
            throw new IllegalArgumentException("Unauthorized to delete this availability slot!");
        }

        availabilitySlotRepository.delete(slot);
    }

    private OffsetDateTime parseToOffsetDateTime(String dateStr, String timeStr) {
        LocalDate date = LocalDate.parse(dateStr, DATE_FORMATTER);
        LocalTime time = LocalTime.parse(timeStr.toUpperCase(), TIME_FORMATTER);
        LocalDateTime localDateTime = LocalDateTime.of(date, time);
        return OffsetDateTime.of(localDateTime, VIETNAM_OFFSET);
    }

    private AvailabilitySlotDto mapToDto(AvailabilitySlot entity) {
        OffsetDateTime vietnamTime = entity.getStartTime().withOffsetSameInstant(VIETNAM_OFFSET);
        LocalDate date = vietnamTime.toLocalDate();
        LocalTime time = vietnamTime.toLocalTime();
        
        String dateStr = date.format(DATE_FORMATTER);
        String timeStr = time.format(TIME_FORMATTER);

        return AvailabilitySlotDto.builder()
                .id(entity.getId().toString())
                .date(dateStr)
                .time(timeStr)
                .status("FREE")
                .title("Available")
                .build();
    }
}
