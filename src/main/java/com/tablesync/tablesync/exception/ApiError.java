package com.tablesync.tablesync.exception;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ApiError {
    private LocalDateTime timestamp;
    private Integer status;
    private String error;
    private List<String> messages;
}
