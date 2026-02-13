package com.tablesync.tablesync.dto.session.response;

import com.tablesync.tablesync.entity.SessionParticipant;
import com.tablesync.tablesync.enums.SessionRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ParticipantResponse {
    private Long userId;
    private String username;
    private SessionRole role;
    private LocalDateTime joinedAt;

    public static ParticipantResponse fromEntity(SessionParticipant participant) {
        return ParticipantResponse.builder()
                .userId(participant.getUser().getId())
                .username(participant.getUser().getRealUsername())
                .role(participant.getRole())
                .joinedAt(participant.getJoinedAt())
                .build();
    }
}
