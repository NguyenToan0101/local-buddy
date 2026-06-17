package localbuddy.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class BookingRequest {
    @NotNull(message = "Buddy ID is required.")
    private UUID buddyId;

    @NotBlank(message = "Title is required.")
    @Size(max = 255, message = "Title must be at most 255 characters.")
    private String title;

    private String activity;

    @Size(max = 2000, message = "Description must be at most 2000 characters.")
    private String description;

    @Pattern(regexp = "PLANNED_ROUTE|CONSULTATION", message = "Booking type must be PLANNED_ROUTE or CONSULTATION.")
    private String bookingType;

    @NotBlank(message = "Location is required.")
    @Size(max = 255, message = "Location must be at most 255 characters.")
    private String location;

    @Size(max = 255, message = "Meeting point must be at most 255 characters.")
    private String meetingPoint;

    @Size(max = 20, message = "Route can include at most 20 stops.")
    private List<@Size(max = 255, message = "Each route stop must be at most 255 characters.") String> routeStops;

    @Size(max = 2000, message = "Itinerary notes must be at most 2000 characters.")
    private String itineraryNotes;

    @NotNull(message = "Booking date is required.")
    @FutureOrPresent(message = "Booking date must be today or in the future.")
    private LocalDate date;

    @NotBlank(message = "Booking time is required.")
    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Booking time must use HH:mm format.")
    private String time;

    @Min(value = 1, message = "Hours must be at least 1.")
    private Integer hours;

    private String duration;

    @Min(value = 1, message = "Guest count must be at least 1.")
    private Integer guests;

    @DecimalMin(value = "0.00", message = "Price must be zero or greater.")
    private BigDecimal price;
}
