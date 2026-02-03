package com.tablesync.tablesync.dto.chat.request;

import com.tablesync.tablesync.enums.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatMessageRequest {
    @NotNull(message = "Session ID is required")
    private UUID sessionId;

    @NotBlank(message = "Character name is required")
    @Size(min = 2, max = 20, message = "Character name must be between 2 and 20 characters")
    private String characterName;

    @NotBlank(message = "Content is required")
    @Size(min = 1, max = 1000, message = "Content must be between 1 and 1000 characters")
    private String content;

    @Builder.Default
    private MessageType messageType = MessageType.NORMAL;

    @Builder.Default
    private transient String diceFormula = null;

    @Builder.Default
    private transient Integer rollResult = null;
}
