package com.tablesync.tablesync.controller;

import com.tablesync.tablesync.dto.chat.request.ChatMessageRequest;
import com.tablesync.tablesync.dto.chat.response.ChatMessageResponse;
import com.tablesync.tablesync.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatRestController {
    private final ChatService chatService;

    @GetMapping("/history/{sessionId}")
    @Operation(summary = "Get chat history", description = "Retrieve paginated chat history for a session")
    @ApiResponse(responseCode = "200", description = "History retrieved successfully")
    @ApiResponse(responseCode = "404", description = "Session not found")
    public ResponseEntity<List<ChatMessageResponse>> getChatHistory(
            @PathVariable UUID sessionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        List<ChatMessageResponse> history = chatService.getSessionHistory(sessionId, page, size);
        return ResponseEntity.ok(history);
    }


    @PostMapping("/send")
    @Operation(summary = "Send message via REST", description = "Send chat message using REST API (alternative to WebSocket)")
    @ApiResponse(responseCode = "200", description = "Message sent successfully")
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @ApiResponse(responseCode = "404", description = "Session not found")
    public ResponseEntity<ChatMessageResponse> sendMessage(
            @RequestBody @Valid ChatMessageRequest request
    ) {
        ChatMessageResponse response = chatService.sendMessage(request);
        return ResponseEntity.ok(response);
    }
}
