package com.tablesync.tablesync.controller;

import com.tablesync.tablesync.dto.chat.request.ChatMessageRequest;
import com.tablesync.tablesync.dto.chat.response.ChatMessageResponse;
import com.tablesync.tablesync.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatController {
    private final ChatService chatService;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload @Valid ChatMessageRequest request) {
        chatService.sendMessage(request);
    }

    @GetMapping("/api/v1/chat/history/{sessionId}")
    public ResponseEntity<List<ChatMessageResponse>> getChatHistory(
            @PathVariable UUID sessionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        List<ChatMessageResponse> history = chatService.getSessionHistory(sessionId, page, size);
        return ResponseEntity.ok(history);
    }

    @PostMapping("/api/v1/chat/send")
    public ResponseEntity<ChatMessageResponse> sendMessageRest(
            @RequestBody @Valid ChatMessageRequest request
    ) {
        ChatMessageResponse response = chatService.sendMessage(request);
        return ResponseEntity.ok(response);
    }
}
