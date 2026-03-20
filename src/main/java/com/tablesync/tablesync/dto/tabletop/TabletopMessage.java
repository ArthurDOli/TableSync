package com.tablesync.tablesync.dto.tabletop;

import lombok.Data;

@Data
public class TabletopMessage {
    private String sessionId;
    private String type;
    private String characterId;
    private Double x;
    private Double y;
    private String imageUrl;
    private String senderUsername;
    private Double imageScale;
    private String npcId;
    private String npcName;
    private String schemaJson;
}
