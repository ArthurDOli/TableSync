package com.tablesync.tablesync.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidationErrors(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .toList();

        return buildResponse(HttpStatus.BAD_REQUEST, "Validation Error", errors);
    }

    private ResponseEntity<ApiError> buildResponse(HttpStatus status, String error, List<String> messages) {
        ApiError apiError = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .error(error)
                .messages(messages)
                .build();

        return ResponseEntity.status(status).body(apiError);
    }
}
