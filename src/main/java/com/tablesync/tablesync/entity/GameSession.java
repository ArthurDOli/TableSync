package com.tablesync.tablesync.entity;

import com.tablesync.tablesync.enums.SessionStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "game_sessions")
public class GameSession {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank(message = "Session name is required")
    @Size(min = 2, max = 100, message = "Session name must be between 2 and 100 characters")
    private String name;

    @Size(max = 1000, message = "Session description must be less than 1000 characters")
    private String description;

    @NotBlank(message = "Password is required")
    private String password;

    @ManyToOne
    @JoinColumn(name = "master_id", nullable = false)
    private User master;

    private String backgroundImageUrl;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status = SessionStatus.ACTIVE;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
