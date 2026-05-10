package com.smarthelmet.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.smarthelmet.backend.config.HelmetApiProperties;
import com.smarthelmet.backend.model.GatewayResponse;
import com.smarthelmet.backend.service.HelmetApiGateway;
import com.smarthelmet.backend.support.ProxyResponseMapper;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/proxy")
public class HelmetLiveKitController {

    private final HelmetApiGateway helmetApiGateway;
    private final ProxyResponseMapper proxyResponseMapper;
    private final HelmetApiProperties helmetApiProperties;

    public HelmetLiveKitController(
            HelmetApiGateway helmetApiGateway,
            ProxyResponseMapper proxyResponseMapper,
            HelmetApiProperties helmetApiProperties
    ) {
        this.helmetApiGateway = helmetApiGateway;
        this.proxyResponseMapper = proxyResponseMapper;
        this.helmetApiProperties = helmetApiProperties;
    }

    @PostMapping("/webrtc/token")
    public ResponseEntity<GatewayResponse> generateLivekitToken(
            @RequestHeader("X-Access-Token") String token,
            @RequestBody JsonNode body
    ) {
        validateLivekitRequest(body);
        return proxyResponseMapper.toJsonResponse(helmetApiGateway.post("/webrtc/token", token, body));
    }

    @GetMapping("/webrtc/server-info")
    public GatewayResponse getLivekitServerInfo() {
        return new GatewayResponse(
                true,
                200,
                "LiveKit 服务地址",
                Map.of("serverUrl", helmetApiProperties.getLivekitServerUrl()),
                Instant.now()
        );
    }

    private void validateLivekitRequest(JsonNode body) {
        ensureBody(body, "LiveKit 请求体不能为空");
        int deviceCount = body.has("devices") && body.get("devices").isArray() ? body.get("devices").size() : 0;
        boolean isMeeting = body.has("isMeeting") && !body.get("isMeeting").isNull()
                ? body.get("isMeeting").asBoolean()
                : deviceCount > 1;
        if (!isMeeting && deviceCount > 1) {
            throw new IllegalArgumentException("非会议模式下 devices 不能超过 1 个");
        }
    }

    private void ensureBody(JsonNode body, String message) {
        if (body == null || body.isNull() || body.isEmpty()) {
            throw new IllegalArgumentException(message);
        }
    }
}
