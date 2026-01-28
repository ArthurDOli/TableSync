package com.tablesync.tablesync.dto.template.response;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tablesync.tablesync.entity.CharacterTemplate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TemplateResponse {
    private UUID id;
    private UUID sessionId;
    private String name;
    private Map<String, Object> schema;

    public static TemplateResponse fromEntity(CharacterTemplate template, ObjectMapper mapper) {
        return TemplateResponse.builder()
                .id(template.getId())
                .sessionId(extractSessionId(template))
                .name(template.getName())
                .schema(parseJsonToMap(template.getSchemaJson(), mapper))
                .build();
    }

    private static UUID extractSessionId(CharacterTemplate template) {
        return (template.getSession() != null) ? template.getSession().getId() : null;
    }

    private static Map<String, Object> parseJsonToMap(String json, ObjectMapper mapper) {
        if (json == null || json.isBlank()) {
            return Collections.emptyMap();
        }

        try {
            return mapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Error parsing template schema JSON", e);
        }
    }
}
