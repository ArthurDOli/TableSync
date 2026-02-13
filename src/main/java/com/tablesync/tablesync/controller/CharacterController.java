package com.tablesync.tablesync.controller;

import com.tablesync.tablesync.dto.character.request.CharacterRequest;
import com.tablesync.tablesync.dto.character.request.UpdateCharacterRequest;
import com.tablesync.tablesync.dto.character.response.CharacterResponse;
import com.tablesync.tablesync.service.CharacterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/characters")
@RequiredArgsConstructor
@Tag(name = "Characters", description = "Character management endpoints")
public class CharacterController {
    private final CharacterService characterService;

    @PostMapping
    @Operation(
            summary = "Create character",
            description = "Create a new character in a session")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Character created successfully"),
            @ApiResponse(
                    responseCode = "404",
                    description = "Invalid request")
    })
    public ResponseEntity<CharacterResponse> createCharacter(@RequestBody @Valid CharacterRequest request) {
        CharacterResponse character = characterService.createCharacter(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(character);
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Get character by Id",
            description = "Retrieve a specific character by its ID"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Character found",
                    content = @Content(schema = @Schema(implementation = CharacterController.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Character not found"
            )
    })
    public ResponseEntity<CharacterResponse> getCharacterById(@PathVariable UUID id) {
        CharacterResponse character = characterService.getCharacterById(id);
        return ResponseEntity.ok(character);
    }

    @GetMapping("/session/{sessionId}")
    @Operation(
            summary = "Get characters by session",
            description = "Retrieve all characters in a specific session"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Characters retrieved successfully"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Session not found"
            )
    })
    public ResponseEntity<List<CharacterResponse>> getCharactersBySession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(characterService.getCharactersBySession(sessionId));
    }

    @PutMapping("/{id}")
    @Operation(
            summary = "Update character",
            description = "Update an existing character (full update)"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Character updated successfully",
                    content = @Content(schema = @Schema(implementation = CharacterController.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Not authorized to update this character"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Character not found"
            )
    })
    public ResponseEntity<CharacterResponse> updatedCharacter(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateCharacterRequest request
            ) {
        CharacterResponse character = characterService.updateCharacter(id, request);
        return ResponseEntity.ok(character);
    }

    @PatchMapping("/{id}")
    @Operation(
            summary = "Partial update character",
            description = "Partially update character fields"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Character updated successfully",
                    content = @Content(schema = @Schema(implementation = CharacterController.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Not authorized to update this character"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Character not found"
            )
    })
    public ResponseEntity<CharacterResponse> partialUpdateCharacter(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateCharacterRequest request
    ) {
        CharacterResponse character = characterService.partialUpdateCharacter(id, request);
        return ResponseEntity.ok(character);
    }

    @DeleteMapping("/{id}")
    @Operation(
            summary = "Delete character",
            description = "Delete a character from the system"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "Character deleted successfully"
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Not authorized to delete this character"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Character not found"
            )
    })
    public ResponseEntity<Void> deleteCharacter(UUID characterId) {
        characterService.deleteCharacter(characterId);
        return ResponseEntity.noContent().build();
    }
}
