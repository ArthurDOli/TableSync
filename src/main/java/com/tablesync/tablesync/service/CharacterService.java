package com.tablesync.tablesync.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tablesync.tablesync.dto.character.request.CharacterRequest;
import com.tablesync.tablesync.dto.character.request.UpdateCharacterRequest;
import com.tablesync.tablesync.dto.character.response.CharacterResponse;
import com.tablesync.tablesync.entity.*;
import com.tablesync.tablesync.exception.ForbiddenException;
import com.tablesync.tablesync.exception.ResourceNotFoundException;
import com.tablesync.tablesync.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CharacterService {
    private final PlayerCharacterRepository characterRepository;
    private final GameSessionRepository sessionRepository;
    private final CharacterTemplateRepository templateRepository;
    private final SessionParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public CharacterResponse createCharacter(CharacterRequest request) {
        User currentUser = getCurrentAuthenticatedUser();
        GameSession session = findSessionById(request.getSessionId());

        validateUserIsParticipant(currentUser.getId(), session.getId());

        CharacterTemplate template = null;

        if (request.getTemplateId() != null) {
            template = findTemplateById(request.getTemplateId());
            validateTemplateBelongsToSession(template, session);
        }

        PlayerCharacter character = buildCharacterEntity(request, session, currentUser, template);
        PlayerCharacter savedCharacter = characterRepository.save(character);

        return CharacterResponse.fromEntity(savedCharacter, objectMapper);
    }

    public List<CharacterResponse> getCharactersBySession(UUID sessionId) {
        validateSessionExistsById(sessionId);

        return characterRepository.findBySessionId(sessionId)
                .stream()
                .map(c -> CharacterResponse.fromEntity(c, objectMapper))
                .toList();
    }

    @Transactional
    public CharacterResponse updateCharacter(UUID characterId, UpdateCharacterRequest request) {
        log.info("Updating character {}", characterId);

        PlayerCharacter character = findCharacterById(characterId);

        validateCharacterOwnership(character);

        updateCharacterFields(character, request);
        PlayerCharacter updatedCharacter = characterRepository.save(character);

        log.info("Character updated successfully: {}", characterId);

        return CharacterResponse.fromEntity(updatedCharacter, objectMapper);
    }

    @Transactional
    public void deleteCharacter(UUID id) {
        log.info("Deleting character {}", id);

        PlayerCharacter character = findCharacterById(id);
        validateCharacterOwnership(character);

        characterRepository.delete(character);
        log.info("Character deleted successfully: {}", id);
    }

    private PlayerCharacter findCharacterById(UUID id) {
        return characterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Character", "id", id));
    }

    private void validateCharacterOwnership(PlayerCharacter character) {
        User currentUser = getCurrentAuthenticatedUser();
        if (!character.getUser().getId().equals(currentUser.getId())) {
            log.warn("User {} attempted to modify character {} owned by user {}",
                    currentUser.getId(), character.getId(), character.getUser().getId());
            throw new ForbiddenException("You can only modify your own characters");
        }
    }

    private void updateCharacterFields(PlayerCharacter character, UpdateCharacterRequest request) {
        if (request.getName() != null) {
            character.setName(request.getName());
        }

        if (request.getImageUrl() != null) {
            character.setImageUrl(request.getImageUrl());
        }

        if (request.getSheetData() != null) {
            character.setSheetData(convertMapToJsonString(request.getSheetData()));
        }

        if (request.getTokenScale() != null) {
            character.setTokenScale(request.getTokenScale());
        }

        if (request.getTokenX() != null) {
            character.setTokenX(request.getTokenX());
        }

        if (request.getTokenY() != null) {
            character.setTokenY(request.getTokenY());
        }
    }

    private void updateCharacterFieldsPartially(PlayerCharacter character, UpdateCharacterRequest request) {
        updateCharacterFields(character, request);
    }

    private void validateSessionExistsById(UUID sessionId) {
        if (!sessionRepository.existsById(sessionId)) {
            throw new RuntimeException("Session not found");
        }
    }

    private User getCurrentAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    private GameSession findSessionById(UUID sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));
    }

    private CharacterTemplate findTemplateById(UUID templateId) {
        return templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template", "id", templateId));
    }

    private void validateUserIsParticipant(Long userId, UUID sessionID) {
        if (!participantRepository.existsByUserIdAndSessionId(userId, sessionID)) {
            throw new IllegalArgumentException("User is not a participant of this session");
        }
    }

    private void validateTemplateBelongsToSession(CharacterTemplate template, GameSession session) {
        if (!template.getSession().getId().equals(session.getId())) {
            throw new IllegalArgumentException("Template does not belong to this session");
        }
    }

    private PlayerCharacter buildCharacterEntity(CharacterRequest request, GameSession session,
                                                 User user, CharacterTemplate template) {
        return PlayerCharacter.builder()
                .name(request.getName())
                .user(user)
                .session(session)
                .template(template)
                .imageUrl(request.getImageUrl())
                .sheetData(convertMapToJsonString(request.getSheetData()))
                .build();
    }

    private String convertMapToJsonString(Map<String, Object> mapper) {
        try {
            return objectMapper.writeValueAsString(mapper);
        } catch (JsonProcessingException e) {
            log.error("Error converting map to JSON", e);
            throw new IllegalArgumentException("Invalid sheet data structure", e);
        }
    }
}
