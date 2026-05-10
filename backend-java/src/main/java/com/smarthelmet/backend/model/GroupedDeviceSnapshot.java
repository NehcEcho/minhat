package com.smarthelmet.backend.model;

import com.fasterxml.jackson.databind.JsonNode;

public record GroupedDeviceSnapshot(
        Long groupId,
        String groupName,
        JsonNode device
) {
}
