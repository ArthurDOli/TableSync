package com.tablesync.tablesync.repository;

import com.tablesync.tablesync.entity.GameSession;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GameSessionRepository extends JpaRepository<GameSession, UUID> {
    @EntityGraph(attributePaths = "master")
    List<GameSession> findByMasterId(Long masterId);

    @EntityGraph(attributePaths = "master")
    Optional<GameSession> findById(UUID id);
}
