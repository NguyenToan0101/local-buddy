package localbuddy.backend.service;

import localbuddy.backend.dto.BuddyAvailabilityDto;
import localbuddy.backend.model.entity.BuddyAvailability;
import localbuddy.backend.model.entity.User;
import localbuddy.backend.repository.BuddyAvailabilityRepository;
import localbuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BuddyAvailabilityService {

    private final BuddyAvailabilityRepository buddyAvailabilityRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<BuddyAvailabilityDto> getAvailabilitiesByBuddy(UUID buddyId) {
        return buddyAvailabilityRepository.findByBuddyId(buddyId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public BuddyAvailabilityDto addAvailability(UUID buddyId, BuddyAvailabilityDto dto) {
        User buddy = userRepository.findById(buddyId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + buddyId));

        // Check for duplicates
        if (buddyAvailabilityRepository.findByBuddyIdAndSlotDateAndSlotTime(buddyId, dto.getDate(), dto.getTime()).isPresent()) {
            throw new IllegalArgumentException("Slot already exists for this date and time!");
        }

        BuddyAvailability availability = BuddyAvailability.builder()
                .buddy(buddy)
                .slotDate(dto.getDate())
                .slotTime(dto.getTime())
                .status(dto.getStatus() != null ? dto.getStatus() : "FREE")
                .title(dto.getTitle() != null ? dto.getTitle() : "Available")
                .build();

        BuddyAvailability saved = buddyAvailabilityRepository.save(availability);
        return mapToDto(saved);
    }

    @Transactional
    public List<BuddyAvailabilityDto> addAvailabilitiesBulk(UUID buddyId, List<BuddyAvailabilityDto> dtos) {
        User buddy = userRepository.findById(buddyId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + buddyId));

        List<BuddyAvailability> toSave = new ArrayList<>();
        for (BuddyAvailabilityDto dto : dtos) {
            // Skip duplicates
            if (buddyAvailabilityRepository.findByBuddyIdAndSlotDateAndSlotTime(buddyId, dto.getDate(), dto.getTime()).isPresent()) {
                continue;
            }

            BuddyAvailability availability = BuddyAvailability.builder()
                    .buddy(buddy)
                    .slotDate(dto.getDate())
                    .slotTime(dto.getTime())
                    .status(dto.getStatus() != null ? dto.getStatus() : "FREE")
                    .title(dto.getTitle() != null ? dto.getTitle() : "Available")
                    .build();
            toSave.add(availability);
        }

        List<BuddyAvailability> saved = buddyAvailabilityRepository.saveAll(toSave);
        return saved.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public void deleteAvailability(UUID buddyId, UUID slotId) {
        BuddyAvailability availability = buddyAvailabilityRepository.findById(slotId)
                .orElseThrow(() -> new IllegalArgumentException("Availability slot not found with ID: " + slotId));

        if (!availability.getBuddy().getId().equals(buddyId)) {
            throw new IllegalArgumentException("Unauthorized to delete this availability slot!");
        }

        buddyAvailabilityRepository.delete(availability);
    }

    private BuddyAvailabilityDto mapToDto(BuddyAvailability entity) {
        return BuddyAvailabilityDto.builder()
                .id(entity.getId().toString())
                .date(entity.getSlotDate())
                .time(entity.getSlotTime())
                .status(entity.getStatus())
                .title(entity.getTitle())
                .build();
    }
}
