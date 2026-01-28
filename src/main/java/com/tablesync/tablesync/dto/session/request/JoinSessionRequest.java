package com.tablesync.tablesync.dto.session.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class JoinSessionRequest {
    @NotBlank(message = "Session ID is required")
    private String sessionId;

    @NotBlank(message = "Password is required")
    private String password;
}
