package com.tablesync.tablesync.controller;

import com.tablesync.tablesync.dto.chat.request.ChatMessageRequest;
import com.tablesync.tablesync.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWebsocketController {
    private final ChatService chatService;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload @Valid ChatMessageRequest request, Principal principal) {
        log.debug("WebSocket message received: {}", request);

        if (principal instanceof UsernamePasswordAuthenticationToken) {
            SecurityContextHolder.getContext().setAuthentication((UsernamePasswordAuthenticationToken) principal);
        }

        try {
            chatService.sendMessage(request);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
