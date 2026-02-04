package com.tablesync.tablesync.repository;

import com.tablesync.tablesync.entity.PlayerCharacter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CharacterRepository extends JpaRepository<PlayerCharacter, UUID> {
    boolean existsByUserIdAndSessionId(Long userId, UUID sessionId);
    List<PlayerCharacter> findBySessionId(UUID sessionId);
    List<PlayerCharacter> findByUserIdAndSessionId(Long userId, UUID sessionId);
}
