package com.tablesync.tablesync.service;

import com.tablesync.tablesync.dto.session.request.CreateSessionRequest;
import com.tablesync.tablesync.dto.session.request.JoinSessionRequest;
import com.tablesync.tablesync.dto.session.request.UpdateSessionRequest;
import com.tablesync.tablesync.dto.session.response.ParticipantResponse;
import com.tablesync.tablesync.dto.session.response.SessionDetailResponse;
import com.tablesync.tablesync.dto.session.response.SessionResponse;
import com.tablesync.tablesync.entity.GameSession;
import com.tablesync.tablesync.entity.SessionParticipant;
import com.tablesync.tablesync.entity.User;
import com.tablesync.tablesync.enums.SessionRole;
import com.tablesync.tablesync.enums.SessionStatus;
import com.tablesync.tablesync.exception.ForbiddenException;
import com.tablesync.tablesync.exception.ResourceNotFoundException;
import com.tablesync.tablesync.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {
    private final GameSessionRepository sessionRepository;
    private final SessionParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PlayerCharacterRepository characterRepository;
    private final CharacterTemplateRepository characterTemplateRepository;

    @Transactional
    public SessionResponse createSession(CreateSessionRequest request) {
        User currentUser = getCurrentAuthenticatedUser();

        GameSession session = buildSessionEntity(request, currentUser);
        GameSession savedSession = sessionRepository.saveAndFlush(session);

        registerMasterAsParticipant(savedSession, currentUser);

        log.info("Session created: {} by user: {}", savedSession.getId(), currentUser.getUsername());

        return SessionResponse.fromEntity(savedSession);
    }

    @Transactional
    public SessionResponse joinSession(JoinSessionRequest request) {
        User currentUser = getCurrentAuthenticatedUser();
        UUID sessionId = UUID.fromString(request.getSessionId());

        GameSession session = findSessionById(sessionId);

        validateUserNotParticipant(currentUser.getId(), sessionId);
        validateSessionPassword(session, request.getPassword());
        validateSessionIsActive(session);

        createAndSavePlayerParticipant(currentUser, session);

        log.info("User {} joined session {}", currentUser.getUsername(), sessionId);

        return SessionResponse.fromEntity(session);
    }

    @Transactional(readOnly = true)
    public SessionDetailResponse getSessionById(UUID sessionId) {
        GameSession session = findSessionById(sessionId);

        List<SessionParticipant> participants = participantRepository.findBySessionId(sessionId);
        List<ParticipantResponse> participantResponses = participants.stream()
                .map(ParticipantResponse::fromEntity)
                .toList();

        Integer totalCharacters = characterRepository.findBySessionId(sessionId).size();
        Integer totalTemplates = characterTemplateRepository.findBySessionId(sessionId).size();

        return SessionDetailResponse.fromEntity(session, participantResponses, totalCharacters, totalTemplates);
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> getMySessions() {
        User currentUser = getCurrentAuthenticatedUser();

        List<SessionParticipant> participants = participantRepository.findByUserId(currentUser.getId());

        return participants.stream()
                .map(participant -> SessionResponse.fromEntity(participant.getSession()))
                .toList();
    }

    @Transactional
    public SessionResponse updateSession(UUID sessionId, UpdateSessionRequest request) {
        log.info("Updating session {}", sessionId);

        GameSession session = findSessionById(sessionId);
        validateMasterPermission(session);

        updateSessionFields(session, request);
        GameSession updatedSession = sessionRepository.save(session);

        log.info("Session updated successfully: {}", sessionId);
        return SessionResponse.fromEntity(updatedSession);
    }

    @Transactional
    public SessionResponse updateSessionStatus(UUID sessionId, SessionStatus status) {
        log.info("Updating session {} status to {}", sessionId, status);

        GameSession session = findSessionById(sessionId);
        validateMasterPermission(session);

        session.setStatus(status);
        GameSession updatedSession = sessionRepository.save(session);

        log.info("Session status updated successfully: {}", sessionId);
        return SessionResponse.fromEntity(updatedSession);
    }

    @Transactional
    public SessionResponse updateBackgroundImage(UUID sessionId, String backgroundUrl) {
        log.info("Updating background for session: {}", sessionId);

        GameSession session = findSessionById(sessionId);
        validateMasterPermission(session);

        session.setBackgroundImageUrl(backgroundUrl);
        GameSession updatedSession = sessionRepository.save(session);

        log.info("Background updated successfully: {}", sessionId);
        return SessionResponse.fromEntity(updatedSession);
    }

    @Transactional
    public void deleteSession(UUID sessionId) {
        log.info("Deleting session: {}", sessionId);

        GameSession session = findSessionById(sessionId);
        validateMasterPermission(session);

        sessionRepository.delete(session);
        log.info("Session deleted successfully: {}", sessionId);
    }

    @Transactional
    public void removeParticipant(UUID sessionId, Long userId) {
        log.info("Removing participant {} from session {}", userId, sessionId);

        GameSession session = findSessionById(sessionId);
        validateMasterPermission(session);

        SessionParticipant participant = findParticipantById(userId, sessionId);
        validateParticipantIsNotMaster(participant);

        participantRepository.delete(participant);
        log.info("Participant removed successfully");
    }

    private void updateSessionFields(GameSession session, UpdateSessionRequest request) {
        if (request.getName() != null) {
            session.setName(request.getName());
        }

        if (request.getDescription() != null) {
            session.setDescription(request.getDescription());
        }

        if (request.getBackgroundImageUrl() != null) {
            session.setBackgroundImageUrl(request.getBackgroundImageUrl());
        }
    }

    private void validateMasterPermission(GameSession session) {
        User currentUser = getCurrentAuthenticatedUser();

        if (!session.getMaster().getId().equals(currentUser.getId())) {
            log.warn("User {} attempted to modify session {} owned by user {}",
                    currentUser.getId(), session.getId(), session.getMaster().getId());
            throw new ForbiddenException("Only the session master can perform this action");
        }
    }

    private void validateParticipantIsNotMaster(SessionParticipant participant) {
        if (participant.getRole() == SessionRole.MASTER) {
            throw new IllegalArgumentException("Cannot remove the session master");
        }
    }

    private User getCurrentAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    private GameSession buildSessionEntity(CreateSessionRequest request, User master) {
        return GameSession.builder()
                .name(request.getName())
                .description(request.getDescription())
                .password(passwordEncoder.encode(request.getPassword()))
                .master(master)
                .status(SessionStatus.ACTIVE)
                .build();
    }

    private void registerMasterAsParticipant(GameSession session, User master) {
        SessionParticipant participant = SessionParticipant.builder()
                .session(session)
                .user(master)
                .role(SessionRole.MASTER)
                .build();

        participantRepository.save(participant);
    }

    private GameSession findSessionById(UUID sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));
    }

    private SessionParticipant findParticipantById(Long userId, UUID sessionId) {
        return participantRepository.findByUserIdAndSessionId(userId, sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant not found"));
    }

    private void validateUserNotParticipant(Long userId, UUID sessionId) {
        if (participantRepository.existsByUserIdAndSessionId(userId, sessionId)) {
            throw new IllegalArgumentException("User is already a participant of this session");
        }
    }

    private void validateSessionPassword(GameSession session, String requestPassword) {
        if (!passwordEncoder.matches(requestPassword, session.getPassword())) {
            log.warn("Invalid password attempt for session: {}", session.getId());
            throw new IllegalArgumentException("Invalid session password");
        }
    }

    private void validateSessionIsActive(GameSession session) {
        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new IllegalStateException("Session is not active");
        }
    }

    private void createAndSavePlayerParticipant(User user, GameSession session) {
        SessionParticipant participant = SessionParticipant.builder()
                .user(user)
                .session(session)
                .role(SessionRole.PLAYER)
                .build();

        participantRepository.save(participant);
    }
}
