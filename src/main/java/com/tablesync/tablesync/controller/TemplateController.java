package com.tablesync.tablesync.controller;

import com.tablesync.tablesync.dto.template.request.CreateTemplateRequest;
import com.tablesync.tablesync.dto.template.request.UpdateTemplateRequest;
import com.tablesync.tablesync.dto.template.response.TemplateResponse;
import com.tablesync.tablesync.service.TemplateService;
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
@RequestMapping("/api/v1/templates")
@RequiredArgsConstructor
@Tag(name = "Templates", description = "Character template management endpoints")
public class TemplateController {
    private final TemplateService templateService;

    @PostMapping
    @Operation(
            summary = "Create template",
            description = "Create a new character template (only session master)"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Template created successfully",
                    content = @Content(schema = @Schema(implementation = TemplateResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request"
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Only master can create templates"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Session not found"
            )
    })
    public ResponseEntity<TemplateResponse> createTemplate(@RequestBody @Valid CreateTemplateRequest request) {
        TemplateResponse response = templateService.createTemplate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/session/{sessionId}")
    @Operation(
            summary = "Get template by Id",
            description = "Retrieve a specific template by its ID"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Template found",
                    content = @Content(schema = @Schema(implementation = TemplateResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Template not found"
            )
    })
    public ResponseEntity<List<TemplateResponse>> listBySession(@PathVariable UUID sessionId) {
        List<TemplateResponse> response = templateService.listTemplatesBySession(sessionId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Get template by ID",
            description = "Retrieve a specific template by its ID"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Template found",
                    content = @Content(schema = @Schema(implementation = TemplateResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Template not found"
            )
    })
    public ResponseEntity<TemplateResponse> getTemplateById(
            @PathVariable UUID id
    ) {
        TemplateResponse template = templateService.getTemplateById(id);
        return ResponseEntity.ok(template);
    }

    @PutMapping("/{id}")
    @Operation(
            summary = "Update template",
            description = "Update an existing template (only session master)"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Template updated successfully",
                    content = @Content(schema = @Schema(implementation = TemplateResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Template not found"
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Only master can update templates"
            )
    })
    public ResponseEntity<TemplateResponse> updateTemplate(
            @PathVariable UUID id,
            @RequestBody UpdateTemplateRequest request
    ) {
        TemplateResponse template = templateService.updateTemplate(id, request);
        return ResponseEntity.ok(template);
    }

    @DeleteMapping("/{id}")
    @Operation(
            summary = "Delete template",
            description = "Delete a template (only session master, cannot delete if in use)"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "Template deleted successfully"),
            @ApiResponse(
                    responseCode = "403",
                    description = "Only master can delete templates"),
            @ApiResponse(
                    responseCode = "404",
                    description = "Template not found"),
            @ApiResponse(
                    responseCode = "409",
                    description = "Template is in use by characters")
    })
    public ResponseEntity<Void> deleteTemplate(
            @PathVariable UUID id
    ) {
        templateService.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }
}
