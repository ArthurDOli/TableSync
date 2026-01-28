package com.tablesync.tablesync.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tablesync.tablesync.dto.template.request.CreateTemplateRequest;
import com.tablesync.tablesync.dto.template.response.TemplateResponse;
import com.tablesync.tablesync.entity.CharacterTemplate;
import com.tablesync.tablesync.entity.GameSession;
import com.tablesync.tablesync.entity.User;
import com.tablesync.tablesync.repository.CharacterTemplateRepository;
import com.tablesync.tablesync.repository.GameSessionRepository;
import com.tablesync.tablesync.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TemplateService {
    private final CharacterTemplateRepository templateRepository;
    private final GameSessionRepository sessionRepository;
    private final UserRepository userRepository;
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

    private User getCurrentAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    private GameSession findSessionById(UUID sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
    }

    private void validateUserIsMaster(GameSession session, User user) {
        if (!session.getMaster().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Only the session master can create templates");
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
            throw new IllegalArgumentException("Invalid schema structure", e);
        }
    }
}
