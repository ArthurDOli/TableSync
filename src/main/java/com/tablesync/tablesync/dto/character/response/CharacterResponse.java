package com.tablesync.tablesync.dto.character.response;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tablesync.tablesync.entity.PlayerCharacter;
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
public class CharacterResponse {
    private UUID id;
    private String name;
    private String playerName;
    private UUID templateId;
    private String imageUrl;
    private Map<String, Object> sheetData;

    public static CharacterResponse fromEntity(PlayerCharacter character, ObjectMapper mapper) {
        return CharacterResponse.builder()
                .id(character.getId())
                .name(character.getName())
                .playerName(character.getUser().getRealUsername())
                .templateId(character.getTemplate() != null ? character.getTemplate().getId() : null)
                .imageUrl(character.getImageUrl())
                .sheetData(parseJsonToMap(character.getSheetData(), mapper))
                .build();
    }

    private static Map<String, Object> parseJsonToMap(String json, ObjectMapper mapper) {
        if (json == null || json.isBlank()) {
            return Collections.emptyMap();
        }

        try {
            return mapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Error parsing character sheet JSON", e);
        }
    }
}
