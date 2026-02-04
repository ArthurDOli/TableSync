package com.tablesync.tablesync.dto.chat.response;

import com.tablesync.tablesync.entity.ChatMessage;
import com.tablesync.tablesync.enums.MessageType;
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
public class ChatMessageResponse {
    private Long id;
    private UUID sessionId;
    private String username;
    private String characterName;
    private String content;
    private MessageType messageType;
    private LocalDateTime timestamp;
    private String diceFormula;
    private Integer rollResult;

    public static ChatMessageResponse fromEntity(ChatMessage message) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .sessionId(message.getSession().getId())
                .username(message.getUser().getRealUsername())
                .characterName(message.getCharacterName())
                .content(message.getContent())
                .messageType(message.getMessageType())
                .timestamp(message.getTimestamp())
                .diceFormula(message.getDiceFormula())
                .rollResult(message.getRollResult())
                .build();
    }
}
