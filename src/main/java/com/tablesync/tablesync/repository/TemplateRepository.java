package com.tablesync.tablesync.repository;

import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TemplateRepository {
    boolean existsBySessionId(UUID sessionId);
}
