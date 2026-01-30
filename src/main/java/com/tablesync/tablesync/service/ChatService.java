package com.tablesync.tablesync.service;

import com.tablesync.tablesync.repository.ChatMessageRepository;
import com.tablesync.tablesync.repository.GameSessionRepository;
import com.tablesync.tablesync.repository.SessionParticipantRepository;
import com.tablesync.tablesync.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Random;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {
    private final ChatMessageRepository chatMessageRepository;
    private final GameSessionRepository sessionRepository;
    private final SessionParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private static final Pattern DICE_PATTERN = Pattern.compile("(\\d+)d(\\d+)(?:([+-])(\\d+))?");
    private static final Random random = new Random();
}
