package com.tablesync.tablesync.entity;

import com.tablesync.tablesync.enums.MessageType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Table(name = "chat_messages")
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @ToString.Exclude
    private GameSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private User user;

    @NotBlank(message = "Character name is required")
    @Size(min = 2, max = 20, message = "Character name must be between 2 and 20 characters")
    @Column(nullable = false)
    private String characterName;

    @NotBlank(message = "Message can not be null")
    @Size(min = 1, max = 1000, message = "Message must be between 2 and 1000 characters")
    @Column(nullable = false, length = 1000)
    private String content;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private MessageType messageType = MessageType.NORMAL;

    @Column(name = "dice_formula", length = 50)
    private String diceFormula;

    @Column(name = "roll_result")
    private Integer rollResult;
}
