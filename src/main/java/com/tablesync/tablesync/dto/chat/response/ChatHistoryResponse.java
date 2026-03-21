package com.tablesync.tablesync.dto.chat.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatHistoryResponse {
    private List<ChatMessageResponse> messages;
    private boolean hasMore;
    private int page;
    private int size;
}
