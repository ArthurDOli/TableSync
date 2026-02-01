package com.tablesync.tablesync.repository;

import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CharacterRepository {
    boolean existsByUserIdAndSessionId(Long userId, UUID sessionId);
}
