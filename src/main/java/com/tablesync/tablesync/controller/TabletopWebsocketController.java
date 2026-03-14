package com.tablesync.tablesync.controller;

import com.tablesync.tablesync.dto.tabletop.TabletopMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class TabletopWebsocketController {
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/tabletop.update")
    public void handleTabletopUpdate(@Payload TabletopMessage message, Principal principal) {
        if (principal != null) {
            message.setSenderUsername(principal.getName());
        }

        messagingTemplate.convertAndSend(
                "/topic/tabletop/" + message.getSessionId(),
                message
        );
    }
}
