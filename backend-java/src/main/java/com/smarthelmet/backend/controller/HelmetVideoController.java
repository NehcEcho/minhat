package com.smarthelmet.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.smarthelmet.backend.config.HelmetApiProperties;
import com.smarthelmet.backend.model.GatewayResponse;
import com.smarthelmet.backend.service.HelmetApiGateway;
import com.smarthelmet.backend.support.ProxyResponseMapper;
import com.smarthelmet.backend.util.RequestParamUtils;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
@RequestMapping("/api/proxy")
public class HelmetVideoController {

    private final HelmetApiGateway helmetApiGateway;
    private final ProxyResponseMapper proxyResponseMapper;
    private final HelmetApiProperties helmetApiProperties;

    public HelmetVideoController(
            HelmetApiGateway helmetApiGateway,
            ProxyResponseMapper proxyResponseMapper,
            HelmetApiProperties helmetApiProperties
    ) {
        this.helmetApiGateway = helmetApiGateway;
        this.proxyResponseMapper = proxyResponseMapper;
        this.helmetApiProperties = helmetApiProperties;
    }

    @GetMapping("/api/v1/stream/start")
    public ResponseEntity<GatewayResponse> startStream(
            @RequestHeader("X-Access-Token") String token,
            @RequestParam MultiValueMap<String, String> queryParams
    ) {
        return proxyResponseMapper.toJsonResponse(
                helmetApiGateway.get("/api/v1/stream/start", token, RequestParamUtils.clean(queryParams))
        );
    }

    @GetMapping("/api/v1/stream/stop")
    public ResponseEntity<GatewayResponse> stopStream(
            @RequestHeader("X-Access-Token") String token,
            @RequestParam MultiValueMap<String, String> queryParams
    ) {
        return proxyResponseMapper.toJsonResponse(
                helmetApiGateway.get("/api/v1/stream/stop", token, RequestParamUtils.clean(queryParams))
        );
    }

    @GetMapping("/api/v1/control/ws-talk-url")
    public GatewayResponse buildTalkUrl(
            @RequestHeader("X-Access-Token") String token,
            @RequestParam String serial,
            @RequestParam(required = false) String code,
            @RequestParam(defaultValue = "pcm") String format
    ) {
        String resolvedCode = code == null || code.isBlank() ? serial : code;
        String mirroredRelayPath = UriComponentsBuilder.fromPath("/api/proxy/api/v1/control/ws-talk/{serial}/{code}")
                .queryParam("format", format)
                .queryParam("token", token)
                .buildAndExpand(serial, resolvedCode)
                .toUriString();
        String helperRelayPath = UriComponentsBuilder.fromPath("/ws/talk-relay")
                .queryParam("serial", serial)
                .queryParam("code", resolvedCode)
                .queryParam("format", format)
                .queryParam("token", token)
                .toUriString();
        String remoteUrl = UriComponentsBuilder.fromUriString(helmetApiProperties.getTalkWebsocketBaseUrl())
                .path("/api/v1/control/ws-talk/{serial}/{code}")
                .queryParam("format", format)
                .queryParam("token", token)
                .buildAndExpand(serial, resolvedCode)
                .toUriString();
        Map<String, Object> payload = new java.util.LinkedHashMap<>();
        payload.put("relayPath", mirroredRelayPath);
        payload.put("helperRelayPath", helperRelayPath);
        payload.put("remoteWebsocketBaseUrl", helmetApiProperties.getTalkWebsocketBaseUrl());
        payload.put("remoteUrl", remoteUrl);
        payload.put("serial", serial);
        payload.put("code", resolvedCode);
        payload.put("format", format);
        return new GatewayResponse(
                true,
                200,
                "已生成语音喊话中继地址",
                payload,
                Instant.now()
        );
    }

    @GetMapping("/api/v1/playback/recordlist")
    public ResponseEntity<GatewayResponse> getRecordList(
            @RequestHeader("X-Access-Token") String token,
            @RequestParam MultiValueMap<String, String> queryParams
    ) {
        return proxyResponseMapper.toJsonResponse(
                helmetApiGateway.get("/api/v1/playback/recordlist", token, RequestParamUtils.clean(queryParams))
        );
    }

    @GetMapping("/api/v1/playback/start")
    public ResponseEntity<GatewayResponse> startPlayback(
            @RequestHeader("X-Access-Token") String token,
            @RequestParam MultiValueMap<String, String> queryParams
    ) {
        return proxyResponseMapper.toJsonResponse(
                helmetApiGateway.get("/api/v1/playback/start", token, RequestParamUtils.clean(queryParams))
        );
    }

    @GetMapping("/api/v1/playback/stop")
    public ResponseEntity<GatewayResponse> stopPlayback(
            @RequestHeader("X-Access-Token") String token,
            @RequestParam MultiValueMap<String, String> queryParams
    ) {
        return proxyResponseMapper.toJsonResponse(
                helmetApiGateway.get("/api/v1/playback/stop", token, RequestParamUtils.clean(queryParams))
        );
    }

    @GetMapping("/api/v1/playback/control")
    public ResponseEntity<GatewayResponse> controlPlayback(
            @RequestHeader("X-Access-Token") String token,
            @RequestParam MultiValueMap<String, String> queryParams
    ) {
        return proxyResponseMapper.toJsonResponse(
                helmetApiGateway.get("/api/v1/playback/control", token, RequestParamUtils.clean(queryParams))
        );
    }

    @GetMapping("/api/v1/playback/streaminfo")
    public ResponseEntity<GatewayResponse> getPlaybackStreamInfo(
            @RequestHeader("X-Access-Token") String token,
            @RequestParam MultiValueMap<String, String> queryParams
    ) {
        return proxyResponseMapper.toJsonResponse(
                helmetApiGateway.get("/api/v1/playback/streaminfo", token, RequestParamUtils.clean(queryParams))
        );
    }

    @PostMapping("/bvcsp/v1/dialog/device/webrtc")
    public ResponseEntity<GatewayResponse> openWebrtcDialog(
            @RequestHeader("X-Access-Token") String token,
            @RequestBody JsonNode body
    ) {
        validateWebrtcRequest(body);
        return proxyResponseMapper.toJsonResponse(helmetApiGateway.post("/bvcsp/v1/dialog/device/webrtc", token, body));
    }

    @PostMapping("/bvcsp/v1/dialog/close/{dialogid}")
    public ResponseEntity<GatewayResponse> closeDialog(
            @RequestHeader("X-Access-Token") String token,
            @PathVariable String dialogid
    ) {
        return proxyResponseMapper.toJsonResponse(helmetApiGateway.post("/bvcsp/v1/dialog/close/" + dialogid, token, null));
    }

    private void validateWebrtcRequest(JsonNode body) {
        if (body == null || body.isNull() || body.isEmpty()) {
            throw new IllegalArgumentException("WebRTC 请求体不能为空");
        }
        if (!body.hasNonNull("id") || body.get("id").asText().isBlank()) {
            throw new IllegalArgumentException("id 不能为空");
        }
        if (!body.has("index") || body.get("index").isNull()) {
            throw new IllegalArgumentException("index 不能为空");
        }
        if (!body.hasNonNull("sdp") || body.get("sdp").asText().isBlank()) {
            throw new IllegalArgumentException("sdp 不能为空");
        }
    }
}
