package com.tablesync.tablesync.dto.session.response;

import com.tablesync.tablesync.entity.GameSession;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SessionDetailResponse {
    private UUID id;
    private String name;
    private String description;
    private String masterName;
    private Long masterId;
    private String status;
    private String backgroundImageUrl;
    private Double backgroundImageScale;
    private String npcTokensJson;
    private LocalDateTime createdAt;
    private List<ParticipantResponse> participants;
    private Integer totalCharacters;
    private Integer totalTemplates;

    public static SessionDetailResponse fromEntity(
            GameSession session,
            List<ParticipantResponse> participants,
            Integer totalCharacters,
            Integer totalTemplates
    ) {
        return SessionDetailResponse.builder()
                .id(session.getId())
                .name(session.getName())
                .description(session.getDescription())
                .masterName(session.getMaster().getUsername())
                .masterId(session.getMaster().getId())
                .status(session.getStatus().name())
                .backgroundImageUrl(session.getBackgroundImageUrl())
                .backgroundImageScale(session.getBackgroundImageScale())
                .npcTokensJson(session.getNpcTokensJson())
                .createdAt(session.getCreatedAt())
                .participants(participants)
                .totalCharacters(totalCharacters)
                .totalTemplates(totalTemplates)
                .build();
    }
}
