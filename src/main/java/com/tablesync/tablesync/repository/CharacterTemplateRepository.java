package com.tablesync.tablesync.repository;

import com.tablesync.tablesync.entity.CharacterTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CharacterTemplateRepository extends JpaRepository<CharacterTemplate, UUID> {
    List<CharacterTemplate> findBySessionId(UUID sessionId);
}
