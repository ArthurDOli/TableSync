package com.tablesync.tablesync.controller;

import com.tablesync.tablesync.dto.character.request.CharacterRequest;
import com.tablesync.tablesync.dto.character.response.CharacterResponse;
import com.tablesync.tablesync.service.CharacterService;
import io.swagger.v3.oas.annotations.Operation;
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
    @Operation(summary = "Create character", description = "Create a new character in a session")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Character created successfully"),
            @ApiResponse(responseCode = "404", description = "Invalid request")
    })
    public ResponseEntity<CharacterResponse> createCharacter(@RequestBody @Valid CharacterRequest request) {
        CharacterResponse character = characterService.createCharacter(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(character);
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<CharacterResponse>> getCharactersBySession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(characterService.getCharactersBySession(sessionId));
    }
}
