package com.tablesync.tablesync.controller;

import com.tablesync.tablesync.dto.session.request.CreateSessionRequest;
import com.tablesync.tablesync.dto.session.request.JoinSessionRequest;
import com.tablesync.tablesync.dto.session.response.SessionResponse;
import com.tablesync.tablesync.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
public class SessionController {
    private final SessionService sessionService;

    @PostMapping
    public ResponseEntity<SessionResponse> createSession(@RequestBody @Valid CreateSessionRequest request) {
        SessionResponse response = sessionService.createSession(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my-sessions")
    public ResponseEntity<List<SessionResponse>> getMySessions() {
        return ResponseEntity.ok(sessionService.getMySessions());
    }

    @PostMapping("/join")
    public ResponseEntity<SessionResponse> joinSession(@RequestBody @Valid JoinSessionRequest request) {
        return ResponseEntity.ok(sessionService.joinSession(request));
    }
}
