package com.tablesync.tablesync.service;

import com.tablesync.tablesync.dto.session.request.CreateSessionRequest;
import com.tablesync.tablesync.dto.session.response.SessionResponse;
import com.tablesync.tablesync.entity.GameSession;
import com.tablesync.tablesync.entity.SessionParticipant;
import com.tablesync.tablesync.entity.User;
import com.tablesync.tablesync.enums.SessionRole;
import com.tablesync.tablesync.enums.SessionStatus;
import com.tablesync.tablesync.repository.GameSessionRepository;
import com.tablesync.tablesync.repository.SessionParticipantRepository;
import com.tablesync.tablesync.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SessionService {
    private final GameSessionRepository sessionRepository;
    private final SessionParticipantRepository participantRepository;
    private final UserRepository userRepository;

    @Transactional
    public SessionResponse createSession(CreateSessionRequest request) {
        User currentUser = getCurrentAuthenticatedUser();

        GameSession session = buildSessionEntity(request, currentUser);
        GameSession savedSession = sessionRepository.saveAndFlush(session);

        registerMasterAsParticipant(savedSession, currentUser);

        return SessionResponse.fromEntity(savedSession);
    }

    public List<SessionResponse> getMySessions() {
        User currentUser = getCurrentAuthenticatedUser();
        return sessionRepository.findByMasterId(currentUser.getId())
                .stream()
                .map(SessionResponse::fromEntity)
                .toList();
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
                .password(request.getPassword())
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
                .orElseThrow(() -> new RuntimeException("Session not found"));
    }

    private void validateUserNotParticipant(Long userId, UUID sessionId) {
        if (participantRepository.existsByUserIdAndSessionId(userId, sessionId)) {
            throw new IllegalArgumentException("User is already a participant of this session");
        }
    }

    private void validateSessionPassword(GameSession session, String requestPassword) {
        if (!session.getPassword().equals(requestPassword)) {
            throw new IllegalArgumentException("Invalid session password");
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
