package com.tablesync.tablesync.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.DynamicUpdate;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@DynamicUpdate
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Table(name = "player_characters")
public class PlayerCharacter {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @NotBlank(message = "Character name is required")
    @Size(min = 2, max = 50, message = "Character name must be between 2 and 50 characters")
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @ToString.Exclude
    private GameSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = true)
    @ToString.Exclude
    private CharacterTemplate template;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String sheetData;

    @Builder.Default
    private Double tokenScale = 1.0;

    private Double tokenX;

    private Double tokenY;

    private String imageUrl;

    @Builder.Default
    private Double imageScale = 1.0;

    @Builder.Default
    private Double imageOffsetX = 50.0;

    @Builder.Default
    private Double imageOffsetY = 50.0;
}
