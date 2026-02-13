package com.tablesync.tablesync.controller;

import com.tablesync.tablesync.dto.session.request.CreateSessionRequest;
import com.tablesync.tablesync.dto.session.request.JoinSessionRequest;
import com.tablesync.tablesync.dto.session.response.SessionResponse;
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
}
