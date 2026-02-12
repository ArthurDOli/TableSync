package com.tablesync.tablesync.dto.character.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateCharacterRequest {
    @Size(min = 2, max = 50, message = "Character name must be between 2 and 50 characters")
    private String name;

    private String imageUrl;

    private Map<String, Object> sheetData;

    private Double tokenScale;

    private Double tokenX;

    private Double tokenY;
}
