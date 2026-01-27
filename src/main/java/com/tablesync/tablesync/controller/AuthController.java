package com.tablesync.tablesync.controller;

import com.tablesync.tablesync.dto.auth.request.LoginRequest;
import com.tablesync.tablesync.dto.auth.request.RegisterRequest;
import com.tablesync.tablesync.dto.auth.response.AuthResponse;
import com.tablesync.tablesync.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService service;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody @Valid RegisterRequest request) {
        AuthResponse user = service.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest request) {
        AuthResponse user = service.authenticate(request);
        return ResponseEntity.status(HttpStatus.OK).body(user);
    }
}
