package com.tablesync.tablesync.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/health")
@Tag(name = "Health", description = "Health check endpoints")
public class HealthCheckController {
    @GetMapping
    @Operation(summary = "Health check", description = "Check if the API is running")
    public ResponseEntity<HealthResponse> healthCheck() {
        HealthResponse response = HealthResponse.builder()
                .status("UP")
                .message("TableSync API is running")
                .timestamp(LocalDateTime.now())
                .version("1.0.0")
                .build();

        return ResponseEntity.ok(response);
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HealthResponse {
        private String status;
        private String message;
        private LocalDateTime timestamp;
        private String version;
    }
}
