package com.tablesync.tablesync.controller;

import com.tablesync.tablesync.dto.session.request.CreateSessionRequest;
import com.tablesync.tablesync.dto.session.request.JoinSessionRequest;
import com.tablesync.tablesync.dto.session.request.UpdateSessionRequest;
import com.tablesync.tablesync.dto.session.response.SessionDetailResponse;
import com.tablesync.tablesync.dto.session.response.SessionResponse;
import com.tablesync.tablesync.enums.SessionStatus;
import com.tablesync.tablesync.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
@Tag(name = "Sessions", description = "Game session management endpoints")
public class SessionController {
    private final SessionService sessionService;

    @PostMapping
    @Operation(
            summary = "Create session",
            description = "Create a new game session"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Session created successfully",
                    content = @Content(schema = @Schema(implementation = SessionResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request"
            )
    })
    public ResponseEntity<SessionResponse> createSession(@RequestBody @Valid CreateSessionRequest request) {
        SessionResponse response = sessionService.createSession(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my-sessions")
    @Operation(
            summary = "Get my sessions",
            description = "Retrieve all sessions where the current user is a participant"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Sessions retrieved successfully"
            )
    })
    public ResponseEntity<List<SessionResponse>> getMySessions() {
        List<SessionResponse> sessions = sessionService.getMySessions();
        return ResponseEntity.ok(sessions);
    }

    @PostMapping("/join")
    @Operation(
            summary = "Join session",
            description = "Join an existing game session with password"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Successfully joined session",
                    content = @Content(schema = @Schema(implementation = SessionResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid password or already a participant"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Session not found"
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Session is not active"
            )
    })
    public ResponseEntity<SessionResponse> joinSession(@RequestBody @Valid JoinSessionRequest request) {
        SessionResponse response = sessionService.joinSession(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Get session details",
            description = "Retrieve detailed information about a specific session"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Session found",
                    content = @Content(schema = @Schema(implementation = SessionDetailResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Session not found"
            )
    })
    public ResponseEntity<SessionDetailResponse> getSessionById(@PathVariable UUID id) {
        SessionDetailResponse session = sessionService.getSessionById(id);
        return ResponseEntity.ok(session);
    }

    @PutMapping("/{id}")
    @Operation(
            summary = "Update session",
            description = "Update session details (only master can update)"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Session updated successfully",
                    content = @Content(schema = @Schema(implementation = SessionResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Only master can update session"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Session not found"
            )
    })
    public ResponseEntity<SessionResponse> updateSession(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateSessionRequest request
            ) {
        SessionResponse session = sessionService.updateSession(id, request);
        return ResponseEntity.ok(session);
    }

    @PatchMapping("/{id}/status")
    @Operation(
            summary = "Update session status",
            description = "Activate or deactivate a session (only master can update)"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Session status updated successfully",
                    content = @Content(schema = @Schema(implementation = SessionResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Only master can update session status"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Session not found"
            )
    })
    public ResponseEntity<SessionResponse> updateSessionStatus(
            @PathVariable UUID id,
            @RequestParam SessionStatus status
    ) {
        SessionResponse response = sessionService.updateSessionStatus(id, status);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/background")
    @Operation(
            summary = "Update session background",
            description = "Update the background image URL for the tabletop (only master can update)"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Background updated successfully",
                    content = @Content(schema = @Schema(implementation = SessionResponse.class))
            ),
            @ApiResponse(responseCode = "404", description = "Session not found"),
            @ApiResponse(responseCode = "403", description = "Only master can update background")
    })
    public ResponseEntity<SessionResponse> updateBackgroundImage(
            @PathVariable UUID id,
            @RequestParam String url,
            @RequestParam(required = false, defaultValue = "1.0") Double scale
    ) {
        SessionResponse response = sessionService.updateBackgroundImage(id, url, scale);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(
            summary = "Delete session",
            description = "Delete a session (only master can delete)"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "Session deleted successfully"),
            @ApiResponse(
                    responseCode = "404",
                    description = "Session not found"),
            @ApiResponse(
                    responseCode = "403",
                    description = "Only master can delete session")
    })
    public ResponseEntity<Void> deleteSession(
            @PathVariable UUID id
    ) {
        sessionService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{sessionId}/participants/{userId}")
    @Operation(
            summary = "Remove participant",
            description = "Remove a participant from the session (only master can remove)"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "Participant removed successfully"),
            @ApiResponse(
                    responseCode = "404",
                    description = "Session or participant not found"),
            @ApiResponse(
                    responseCode = "403",
                    description = "Only master can remove participants")
    })
    public ResponseEntity<Void> removeParticipant(
            @PathVariable UUID sessionId,
            @PathVariable Long userId
    ) {
        sessionService.removeParticipant(sessionId, userId);
        return ResponseEntity.noContent().build();
    }
}
