package localbuddy.backend.model.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Converts between List<String> (Java) and TEXT[] (PostgreSQL).
 * Stores as comma-separated string internally; works with native array column via @Column(columnDefinition="TEXT[]").
 * For full native array support consider using a custom Hibernate type (e.g. hibernate-types).
 */
@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {

    private static final String DELIMITER = ",";

    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        if (attribute == null || attribute.isEmpty()) return null;
        return String.join(DELIMITER, attribute);
    }

    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) return Collections.emptyList();
        return Arrays.asList(dbData.split(DELIMITER));
    }
}
