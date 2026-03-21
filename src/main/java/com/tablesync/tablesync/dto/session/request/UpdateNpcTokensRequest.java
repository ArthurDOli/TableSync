package com.tablesync.tablesync.dto.session.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateNpcTokensRequest {
    private String npcTokensJson;
}
