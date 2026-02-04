package com.tablesync.tablesync.repository;

import com.tablesync.tablesync.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
     @EntityGraph(attributePaths = {"user", "session"})
     Page<ChatMessage> findBySessionIdOrderByTimestampDesc(UUID sessionId, Pageable pageable);
}
