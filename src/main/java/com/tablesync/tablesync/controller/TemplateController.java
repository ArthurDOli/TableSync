package com.tablesync.tablesync.controller;

import com.tablesync.tablesync.dto.template.request.CreateTemplateRequest;
import com.tablesync.tablesync.dto.template.response.TemplateResponse;
import com.tablesync.tablesync.service.TemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/templates")
@RequiredArgsConstructor
public class TemplateController {
    private final TemplateService templateService;

    @PostMapping
    public ResponseEntity<TemplateResponse> createTemplate(@RequestBody @Valid CreateTemplateRequest request) {
        TemplateResponse response = templateService.createTemplate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<TemplateResponse>> listBySession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(templateService.listTemplatesBySession(sessionId));
    }
}
