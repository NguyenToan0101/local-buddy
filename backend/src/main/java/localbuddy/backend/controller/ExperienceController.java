package localbuddy.backend.controller;

import localbuddy.backend.dto.ExperienceDto;
import localbuddy.backend.service.ExperienceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/experiences")
@RequiredArgsConstructor
public class ExperienceController {

    private final ExperienceService experienceService;

    @GetMapping("/search")
    public ResponseEntity<Page<ExperienceDto>> searchExperiences(
            @RequestParam(required = false) String searchQuery,
            @RequestParam(required = false) List<String> tags,
            @RequestParam(required = false) String duration,
            @RequestParam(required = false) Short rating,
            @PageableDefault(page = 0, size = 10) Pageable pageable
    ) {
        return ResponseEntity.ok(experienceService.searchExperiences(searchQuery, tags, duration, rating, pageable));
    }

    @GetMapping
    public ResponseEntity<List<ExperienceDto>> getExperiences(@RequestParam(required = false) UUID buddyId) {
        return ResponseEntity.ok(experienceService.getAllExperiences(buddyId));
    }

    @GetMapping("/{experienceId}")
    public ResponseEntity<ExperienceDto> getExperience(@PathVariable UUID experienceId) {
        return ResponseEntity.ok(experienceService.getExperience(experienceId));
    }

    @PostMapping
    public ResponseEntity<ExperienceDto> createExperience(@RequestBody ExperienceDto dto) {
        return ResponseEntity.ok(experienceService.createExperience(getCurrentUserId(), dto));
    }

    @PostMapping(value = "/{experienceId}/image", consumes = "multipart/form-data")
    public ResponseEntity<ExperienceDto> uploadExperienceImage(
            @PathVariable UUID experienceId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Integer displayOrder
    ) {
        return ResponseEntity.ok(experienceService.updateExperienceImage(getCurrentUserId(), experienceId, file, displayOrder));
    }

    @PutMapping("/{experienceId}")
    public ResponseEntity<ExperienceDto> updateExperience(
            @PathVariable UUID experienceId,
            @RequestBody ExperienceDto dto
    ) {
        return ResponseEntity.ok(experienceService.updateExperience(getCurrentUserId(), experienceId, dto));
    }

    @DeleteMapping("/{experienceId}")
    public ResponseEntity<Void> deleteExperience(@PathVariable UUID experienceId) {
        experienceService.deleteExperience(getCurrentUserId(), experienceId);
        return ResponseEntity.noContent().build();
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("User not authenticated.");
        }

        Object credentials = authentication.getCredentials();
        if (!(credentials instanceof String userId)) {
            throw new IllegalArgumentException("User ID not found in authentication.");
        }

        return UUID.fromString(userId);
    }
}
