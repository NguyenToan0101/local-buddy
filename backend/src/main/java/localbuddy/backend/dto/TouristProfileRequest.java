package localbuddy.backend.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TouristProfileRequest {
    private String nationality;
    private String bio;
    private List<String> languages;
    private List<String> interests;
    private String eVisaNumber;
    private String eVisaCountry;
    private String eVisaExpiryDate;
    private String eVisaEvidence;
}
