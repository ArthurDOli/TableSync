package com.tablesync.tablesync.entity;

import com.tablesync.tablesync.enums.SessionRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Table(name = "session_participants", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "session_id"})
})
public class SessionParticipant {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @ToString.Exclude
    private GameSession session;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionRole role;

    @CreationTimestamp
    private LocalDateTime joinedAt;
}
