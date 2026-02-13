package com.tablesync.tablesync.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tablesync.tablesync.dto.template.request.CreateTemplateRequest;
import com.tablesync.tablesync.dto.template.request.UpdateTemplateRequest;
import com.tablesync.tablesync.dto.template.response.TemplateResponse;
import com.tablesync.tablesync.entity.CharacterTemplate;
import com.tablesync.tablesync.entity.GameSession;
import com.tablesync.tablesync.entity.PlayerCharacter;
import com.tablesync.tablesync.entity.User;
import com.tablesync.tablesync.exception.ForbiddenException;
import com.tablesync.tablesync.exception.ResourceNotFoundException;
import com.tablesync.tablesync.repository.CharacterTemplateRepository;
import com.tablesync.tablesync.repository.GameSessionRepository;
import com.tablesync.tablesync.repository.PlayerCharacterRepository;
import com.tablesync.tablesync.repository.UserRepository;
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
public class TemplateService {
    private final CharacterTemplateRepository templateRepository;
    private final GameSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final PlayerCharacterRepository characterRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public TemplateResponse createTemplate(CreateTemplateRequest request) {
        User currentUser = getCurrentAuthenticatedUser();
        GameSession session = findSessionById(request.getSessionId());

        validateUserIsMaster(session, currentUser);

        CharacterTemplate template = buildTemplateEntity(request, session);
        CharacterTemplate savedTemplate = templateRepository.save(template);

        return TemplateResponse.fromEntity(savedTemplate, objectMapper);
    }

    public List<TemplateResponse> listTemplatesBySession(UUID sessionId) {
        return templateRepository.findBySessionId(sessionId)
                .stream()
                .map(t -> TemplateResponse.fromEntity(t, objectMapper))
                .toList();
    }

    @Transactional
    public void deleteTemplate(UUID templateId) {
        log.info("Deleting template: {}", templateId);

        CharacterTemplate template = findTemplateById(templateId);
        validateTemplateNotInUse(templateId);
        validateUserIsMaster(template.getSession(), getCurrentAuthenticatedUser());

        templateRepository.delete(template);
        log.info("Template deleted successfully: {}", templateId);
    }

    private void validateTemplateNotInUse(UUID templateId) {
        List<PlayerCharacter> charactersUsingTemplate = characterRepository.findAll().stream()
                .filter(c -> c.getTemplate() != null && c.getTemplate().getId().equals(templateId))
                .toList();

        if (!charactersUsingTemplate.isEmpty()) {
            log.warn("Attempted to delete template {} which is in use by {} characters",
                    templateId, charactersUsingTemplate.size());
            throw new IllegalStateException(
                    String.format("Cannot delete template: %d character(s) are using it",
                            charactersUsingTemplate.size())
            );
        }
    }

    private void updateTemplateFields(CharacterTemplate template, UpdateTemplateRequest request) {
        if (request.getName() != null) {
            template.setName(request.getName());
        }

        if (request.getSchema() != null) {
            template.setSchemaJson(convertMapToJsonString(request.getSchema()));
        }
    }

    private CharacterTemplate findTemplateById(UUID templateId) {
        return templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template", "id", templateId));
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

    private void validateUserIsMaster(GameSession session, User user) {
        if (!session.getMaster().getId().equals(user.getId())) {
            log.warn("User {} attempted to modify template in session {} owned by user {}",
                    user.getId(), session.getId(), session.getMaster().getId());
            throw new ForbiddenException("Only the session master can create templates");
        }
    }

    private CharacterTemplate buildTemplateEntity(CreateTemplateRequest request, GameSession session) {
        return CharacterTemplate.builder()
                .name(request.getName())
                .session(session)
                .schemaJson(convertMapToJsonString(request.getSchema()))
                .build();
    }

    private String convertMapToJsonString(Map<String, Object> schemaMap) {
        try {
            return objectMapper.writeValueAsString(schemaMap);
        } catch (JsonProcessingException e) {
            log.error("Error converting schema map to JSON", e);
            throw new IllegalArgumentException("Invalid schema structure", e);
        }
    }
}
