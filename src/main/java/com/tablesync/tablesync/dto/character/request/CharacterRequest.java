package com.tablesync.tablesync.dto.character.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CharacterRequest {
    @NotNull(message = "Session ID is required")
    private UUID sessionId;

    private UUID templateId;

    @NotBlank(message = "Character name is required")
    @Size(min = 2, max = 50)
    private String name;

    private String imageUrl;

    private Double imageScale;

    private Double imageOffsetX;

    private Double imageOffsetY;

    @NotNull(message = "Sheet data is required")
    private Map<String, Object> sheetData;
}
