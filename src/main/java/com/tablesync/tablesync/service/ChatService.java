package com.tablesync.tablesync.service;

import com.tablesync.tablesync.dto.chat.request.ChatMessageRequest;
import com.tablesync.tablesync.dto.chat.response.ChatMessageResponse;
import com.tablesync.tablesync.entity.ChatMessage;
import com.tablesync.tablesync.entity.GameSession;
import com.tablesync.tablesync.entity.User;
import com.tablesync.tablesync.enums.MessageType;
import com.tablesync.tablesync.exception.ResourceNotFoundException;
import com.tablesync.tablesync.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.regex.Matcher;
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
    private final TemplateRepository templateRepository;
    private final PlayerCharacterRepository characterRepository;

    private static final Pattern DICE_PATTERN = Pattern.compile("(\\d+)d(\\d+)(?:([+-])(\\d+))?");
    private static final Random random = new Random();

    @Transactional
    public ChatMessageResponse sendMessage(ChatMessageRequest request) {
        User currentUser = getCurrentAuthenticatedUser();
        GameSession session = findSessionById(request.getSessionId());

        validateUserIsParticipant(currentUser.getId(), session.getId());
        validateSessionHasTemplate(session.getId());
        validateUserHasCharacter(currentUser.getId(), session.getId());

        processDiceRolls(request);

        ChatMessage message = buildChatMessage(request, session, currentUser);
        ChatMessage savedMessage = chatMessageRepository.save(message);

        ChatMessageResponse response = ChatMessageResponse.fromEntity(savedMessage);

        broadcastToSession(session.getId(), response);

        log.info("Message sent to session {} by user {}", session.getId(), currentUser.getUsername());

        return response;
    }

    public List<ChatMessageResponse> getSessionHistory(UUID sessionId, int page, int size) {
        validateSessionExists(sessionId);

        Pageable pageable = PageRequest.of(page, size);
        Page<ChatMessage> messagePage = chatMessageRepository
                .findBySessionIdOrderByTimestampDesc(sessionId, pageable);

        return messagePage.getContent()
                .stream()
                .map(ChatMessageResponse::fromEntity)
                .toList();
    }

    private void validateSessionHasTemplate(UUID sessionId) {
        boolean hasTemplate = templateRepository.existsBySessionId(sessionId);

        if (!hasTemplate) {
            throw new IllegalArgumentException(
                    "Session must have at least one character template before allowing chat"
            );
        }
    }

    private void validateUserHasCharacter(Long userId, UUID sessionId) {
        boolean hasCharacter = characterRepository.existsByUserIdAndSessionId(userId, sessionId);

        if (!hasCharacter) {
            throw new IllegalArgumentException(
                    "You must create a character in this session before sending messages"
            );
        }
    }

    private void processDiceRolls(ChatMessageRequest request) {
        if (request.getMessageType() == MessageType.DICE_ROLL) {
            String formula = request.getContent().trim();
            Integer rollResult = rollDice(formula);

            request.setDiceFormula(formula);
            request.setRollResult(rollResult);
            request.setContent(formatDiceRollMessage(formula, rollResult));
        }
    }

    private Integer rollDice(String diceFormula) {
        Matcher matcher = DICE_PATTERN.matcher(diceFormula.toLowerCase().replaceAll("\\s", ""));

        validateDiceFormula(matcher, diceFormula);

        int numberOfDice = Integer.parseInt(matcher.group(1));
        int diceType = Integer.parseInt(matcher.group(2));

        validateDiceValue(numberOfDice);
        validateDiceType(diceType);

        int total = 0;
        for (int i = 0; i < numberOfDice; i++) {
            total += random.nextInt(diceType) + 1;
        }

        String operator = matcher.group(3);
        total = applyModifier(operator, matcher, total);

        return total;
    }

    private void validateDiceFormula(Matcher matcher, String diceFormula) {
        if (!matcher.matches()) {
            throw new IllegalArgumentException("Invalid dice formula: " + diceFormula);
        }
    }

    private void validateDiceValue(int numberOfDice) {
        if (numberOfDice < 1 || numberOfDice > 100) {
            throw new IllegalArgumentException("Number of dice must be between 1 and 100");
        }
    }

    private int applyModifier(String operator, Matcher matcher, int total) {
        if (operator != null) {
            int modifier = Integer.parseInt(matcher.group(4));
            return operator.equals("+") ? total + modifier : total - modifier;
        }
        return total;
    }

    private void validateDiceType(int diceType) {
        if (diceType < 2 || diceType > 1000) {
            throw new IllegalArgumentException("Dice type must be between 2 and 1000");
        }
    }

    private String formatDiceRollMessage(String formula, Integer result) {
        return String.format("Rolled %s = %d", formula, result);
    }

    private void broadcastToSession(UUID sessionId, ChatMessageResponse message) {
        messagingTemplate.convertAndSend(
                "/topic/session/" + sessionId,
                message
        );
    }

    private ChatMessage buildChatMessage(ChatMessageRequest request, GameSession session, User user) {
        return ChatMessage.builder()
                .session(session)
                .user(user)
                .characterName(request.getCharacterName())
                .content(request.getContent())
                .messageType(request.getMessageType())
                .diceFormula(request.getDiceFormula())
                .rollResult(request.getRollResult())
                .build();
    }

    public User getCurrentAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    private GameSession findSessionById(UUID sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));
    }

    private void validateUserIsParticipant(Long userId, UUID sessionId) {
        if (!participantRepository.existsByUserIdAndSessionId(userId, sessionId)) {
            throw new IllegalArgumentException("User is not a participant of this session");
        }
    }

    private void validateSessionExists(UUID sessionId) {
        if (!sessionRepository.existsById(sessionId)) {
            throw new ResourceNotFoundException("Session", "id", sessionId);
        }
    }
}
