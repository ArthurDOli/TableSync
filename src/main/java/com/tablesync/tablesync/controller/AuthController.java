package com.tablesync.tablesync.controller;

import com.tablesync.tablesync.dto.auth.request.LoginRequest;
import com.tablesync.tablesync.dto.auth.request.RegisterRequest;
import com.tablesync.tablesync.dto.auth.response.AuthResponse;
import com.tablesync.tablesync.service.AuthService;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication and registration endpoints")
public class AuthController {
    private final AuthService service;

    @PostMapping("/register")
    @Operation(
            summary = "Register new user",
            description = "Create a new user account and return JWT token"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "User registered successfully",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid input or email already exists"
            )
    })
    public ResponseEntity<AuthResponse> register(@RequestBody @Valid RegisterRequest request) {
        AuthResponse user = service.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @PostMapping("/login")
    @Operation(
            summary = "Login user",
            description = "Authenticate user and return JWT token"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Login successful",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Invalid credentials"
            )
    })
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest request) {
        AuthResponse user = service.authenticate(request);
        return ResponseEntity.status(HttpStatus.OK).body(user);
    }
}
