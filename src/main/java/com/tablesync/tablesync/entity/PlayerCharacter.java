package com.tablesync.tablesync.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "player_characters")
public class PlayerCharacter {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank(message = "Character name is required")
    @Size(min = 2, max = 50, message = "Character name must be between 2 and 50 characters")
    private String name;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "session_id", nullable = false)
    private GameSession session;

    @ManyToOne
    @JoinColumn(name = "template_id", nullable = true)
    private CharacterTemplate template;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String sheetData;

    @Builder.Default
    private Double tokenScale = 1.0;

    private Double tokenX;

    private Double tokenY;

    private String imageUrl;
}
