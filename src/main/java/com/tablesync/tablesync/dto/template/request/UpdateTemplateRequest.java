package com.tablesync.tablesync.dto.template.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateTemplateRequest {
    @Size(min = 2, max = 50, message = "Template name must be between 2 and 50 characters")
    private String name;

    private Map<String, Object> schema;
}
