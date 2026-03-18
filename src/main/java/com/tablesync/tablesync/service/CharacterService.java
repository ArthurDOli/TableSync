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
        log.info("Creating character: {} in session: {}", request.getName(), request.getSessionId());

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

        log.info("Character created successfully: {}", savedCharacter.getId());
        return CharacterResponse.fromEntity(savedCharacter, objectMapper);
    }

    @Transactional(readOnly = true)
    public CharacterResponse getCharacterById(UUID characterId) {
        log.info("Fetching character by id: {}", characterId);

        PlayerCharacter character = characterRepository.findById(characterId)
                .orElseThrow(() -> new ResourceNotFoundException("Character", "id", characterId));

        return CharacterResponse.fromEntity(character, objectMapper);
    }

    @Transactional(readOnly = true)
    public List<CharacterResponse> getCharactersBySession(UUID sessionId) {
        log.info("Fetching characters for session: {}", sessionId);

        validateSessionExistsById(sessionId);

        List<PlayerCharacter> characters = characterRepository.findBySessionId(sessionId);

        return characters.stream()
                .map(c -> CharacterResponse.fromEntity(c, objectMapper))
                .toList();
    }

    @Transactional
    public CharacterResponse updateCharacter(UUID characterId, UpdateCharacterRequest request) {
        log.info("Updating character {}", characterId);

        User currentUser = getCurrentAuthenticatedUser();
        PlayerCharacter character = findCharacterById(characterId);

        validateUserIsParticipant(currentUser.getId(), character.getSession().getId());

        updateCharacterFields(character, request);
        PlayerCharacter updatedCharacter = characterRepository.save(character);

        log.info("Character updated successfully: {}", characterId);
        return CharacterResponse.fromEntity(updatedCharacter, objectMapper);
    }

    @Transactional
    public CharacterResponse partialUpdateCharacter(UUID characterId, UpdateCharacterRequest request) {
        log.info("Partially updating character {}", characterId);

        User currentUser = getCurrentAuthenticatedUser();
        PlayerCharacter character = findCharacterById(characterId);

        validateUserIsParticipant(currentUser.getId(), character.getSession().getId());

        updateCharacterFields(character, request);
        PlayerCharacter updatedCharacter = characterRepository.save(character);

        log.info("Character partially updated: {}", characterId);
        return CharacterResponse.fromEntity(updatedCharacter, objectMapper);
    }

    @Transactional
    public void deleteCharacter(UUID id) {
        log.info("Deleting character {}", id);

        User currentUser = getCurrentAuthenticatedUser();
        PlayerCharacter character = findCharacterById(id);

        validateCharacterOwnership(character, currentUser);

        characterRepository.delete(character);
        log.info("Character deleted successfully: {}", id);
    }

    private PlayerCharacter findCharacterById(UUID id) {
        return characterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Character", "id", id));
    }

    private void validateCharacterOwnership(PlayerCharacter character, User currentUser) {
        if (!character.getUser().getId().equals(currentUser.getId())) {
            log.warn("User {} attempted to delete character {} owned by user {}",
                    currentUser.getId(), character.getId(), character.getUser().getId());
            throw new ForbiddenException("You can only delete your own characters");
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
        if (request.getImageScale() != null) {
            character.setImageScale(request.getImageScale());
        }
        if (request.getImageOffsetX() != null) {
            character.setImageOffsetX(request.getImageOffsetX());
        }
        if (request.getImageOffsetY() != null) {
            character.setImageOffsetY(request.getImageOffsetY());
        }
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

    private void validateUserIsParticipant(Long userId, UUID sessionId) {
        if (!participantRepository.existsByUserIdAndSessionId(userId, sessionId)) {
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
                .imageScale(request.getImageScale() != null ? request.getImageScale() : 1.0)
                .imageOffsetX(request.getImageOffsetX() != null ? request.getImageOffsetX() : 50.0)
                .imageOffsetY(request.getImageOffsetY() != null ? request.getImageOffsetY() : 50.0)
                .sheetData(convertMapToJsonString(request.getSheetData()))
                .build();
    }

    private String convertMapToJsonString(Map<String, Object> map) {
        try {
            return objectMapper.writeValueAsString(map);
        } catch (JsonProcessingException e) {
            log.error("Error converting map to JSON", e);
            throw new IllegalArgumentException("Invalid sheet data structure", e);
        }
    }
}