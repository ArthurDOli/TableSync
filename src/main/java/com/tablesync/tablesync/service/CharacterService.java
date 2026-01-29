package com.tablesync.tablesync.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tablesync.tablesync.dto.character.request.CharacterRequest;
import com.tablesync.tablesync.dto.character.response.CharacterResponse;
import com.tablesync.tablesync.entity.*;
import com.tablesync.tablesync.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
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
                .orElseThrow(() -> new RuntimeException("Session not found"));
    }

    private CharacterTemplate findTemplateById(UUID templateId) {
        return templateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found"));
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
            throw new IllegalArgumentException("Invalid sheet data structure", e);
        }
    }
}
