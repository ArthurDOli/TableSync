package com.tablesync.tablesync.controller;

import com.tablesync.tablesync.dto.character.request.CharacterRequest;
import com.tablesync.tablesync.dto.character.response.CharacterResponse;
import com.tablesync.tablesync.service.CharacterService;
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
public class CharacterController {
    private final CharacterService characterService;

    @PostMapping
    public ResponseEntity<CharacterResponse> createCharacter(@RequestBody @Valid CharacterRequest request) {
        CharacterResponse character = characterService.createCharacter(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(character);
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<CharacterResponse>> getCharactersBySession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(characterService.getCharactersBySession(sessionId));
    }
}
