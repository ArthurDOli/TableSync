package com.tablesync.tablesync.repository;

import com.tablesync.tablesync.entity.PlayerCharacter;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlayerCharacterRepository extends JpaRepository<PlayerCharacter, UUID> {
    @EntityGraph(attributePaths = {"session", "user"})
    List<PlayerCharacter> findBySessionId(UUID sessionId);

    boolean existsByUserIdAndSessionId(Long userId, UUID sessionId);
}
