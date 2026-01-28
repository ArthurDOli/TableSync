package com.tablesync.tablesync.dto.session.response;

import com.tablesync.tablesync.entity.GameSession;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SessionResponse {
    private UUID id;
    private String name;
    private String description;
    private String masterName;
    private Long masterId;
    private String status;
    private LocalDateTime createdAt;

    public static SessionResponse fromEntity(GameSession session) {
        return SessionResponse.builder()
                .id(session.getId())
                .name(session.getName())
                .description(session.getDescription())
                .masterName(session.getMaster().getUsername())
                .masterId(session.getMaster().getId())
                .status(session.getStatus().name())
                .createdAt(session.getCreatedAt())
                .build();
    }
}
