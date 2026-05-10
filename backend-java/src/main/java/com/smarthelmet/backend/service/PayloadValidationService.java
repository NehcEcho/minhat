package com.smarthelmet.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;

@Service
public class PayloadValidationService {

    public void validateFencePayload(JsonNode body, boolean createMode) {
        ensureBody(body);
        if (createMode) {
            requireText(body, "fenceName");
            requireText(body, "startTimeStr");
            requireText(body, "endTimeStr");
            requirePresent(body, "eventType");
            requireArray(body, "deviceIndexIds");
            requireText(body, "fenceShape");
        }
        if (body.hasNonNull("fenceShape")) {
            String shape = body.get("fenceShape").asText();
            if ("Circle".equalsIgnoreCase(shape)) {
                JsonNode circle = body.get("circleFenceData");
                if (circle == null || circle.isNull()) {
                    throw new IllegalArgumentException("Circle 围栏必须传 circleFenceData");
                }
                requirePresent(circle, "radius");
                JsonNode center = circle.get("center");
                if (center == null || center.isNull()) {
                    throw new IllegalArgumentException("Circle 围栏必须传 center");
                }
                requireText(center, "longitude");
                requireText(center, "latitude");
            }
            if ("Polygon".equalsIgnoreCase(shape)) {
                JsonNode polygon = body.get("polygonFenceData");
                if (polygon == null || !polygon.isArray() || polygon.isEmpty()) {
                    throw new IllegalArgumentException("Polygon 围栏必须传 polygonFenceData 数组");
                }
            }
        }
    }

    public void validateTalkCommand(JsonNode body) {
        ensureBody(body);
        requirePresent(body, "groupId");
        requireText(body, "command");
        String command = body.get("command").asText();
        if ("8010".equals(command) || "8011".equals(command)) {
            requireText(body, "clientId");
        }
        if ("8014".equals(command) || "8015".equals(command)) {
            requireText(body, "deviceId");
        }
    }

    private void ensureBody(JsonNode body) {
        if (body == null || body.isNull() || body.isEmpty()) {
            throw new IllegalArgumentException("请求体不能为空");
        }
    }

    private void requireText(JsonNode body, String field) {
        if (!body.hasNonNull(field) || body.get(field).asText().isBlank()) {
            throw new IllegalArgumentException(field + " 不能为空");
        }
    }

    private void requirePresent(JsonNode body, String field) {
        if (!body.has(field) || body.get(field).isNull()) {
            throw new IllegalArgumentException(field + " 不能为空");
        }
    }

    private void requireArray(JsonNode body, String field) {
        if (!body.has(field) || !body.get(field).isArray()) {
            throw new IllegalArgumentException(field + " 必须是数组");
        }
    }
}
