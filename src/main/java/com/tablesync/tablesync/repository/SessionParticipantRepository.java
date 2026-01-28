package com.tablesync.tablesync.repository;

import com.tablesync.tablesync.entity.SessionParticipant;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionParticipantRepository extends JpaRepository<SessionParticipant, UUID> {
    boolean existsByUserIdAndSessionId(Long userId, UUID sessionId);

    @EntityGraph(attributePaths = {"user", "session"})
    Optional<SessionParticipant> findByUserIdAndSessionId(Long userId, UUID sessionId);

    @EntityGraph(attributePaths = "user")
    List<SessionParticipant> findBySessionId(UUID sessionId);

    @EntityGraph(attributePaths = {"session", "session.master"})
    List<SessionParticipant> findByUserId(Long userId);
}
