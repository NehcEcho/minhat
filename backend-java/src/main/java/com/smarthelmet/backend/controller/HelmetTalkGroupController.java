package com.smarthelmet.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.smarthelmet.backend.model.GatewayResponse;
import com.smarthelmet.backend.service.HelmetApiGateway;
import com.smarthelmet.backend.service.PayloadValidationService;
import com.smarthelmet.backend.support.ProxyResponseMapper;
import com.smarthelmet.backend.util.RequestParamUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/proxy")
public class HelmetTalkGroupController {

    private final HelmetApiGateway helmetApiGateway;
    private final PayloadValidationService payloadValidationService;
    private final ProxyResponseMapper proxyResponseMapper;

    public HelmetTalkGroupController(
            HelmetApiGateway helmetApiGateway,
            PayloadValidationService payloadValidationService,
            ProxyResponseMapper proxyResponseMapper
    ) {
        this.helmetApiGateway = helmetApiGateway;
        this.payloadValidationService = payloadValidationService;
        this.proxyResponseMapper = proxyResponseMapper;
    }

    @PostMapping("/v1/talkgroups")
    public ResponseEntity<GatewayResponse> createTalkGroup(
            @RequestHeader("X-Access-Token") String token,
            @RequestBody JsonNode body
    ) {
        return proxyResponseMapper.toJsonResponse(helmetApiGateway.post("/v1/talkgroups", token, body));
    }

    @DeleteMapping("/v1/talkgroups/{id}")
    public ResponseEntity<GatewayResponse> deleteTalkGroup(
            @RequestHeader("X-Access-Token") String token,
            @PathVariable String id
    ) {
        return proxyResponseMapper.toJsonResponse(helmetApiGateway.delete("/v1/talkgroups/" + id, token, null));
    }

    @PutMapping("/v1/talkgroups/{id}")
    public ResponseEntity<GatewayResponse> updateTalkGroup(
            @RequestHeader("X-Access-Token") String token,
            @PathVariable String id,
            @RequestBody JsonNode body
    ) {
        return proxyResponseMapper.toJsonResponse(helmetApiGateway.put("/v1/talkgroups/" + id, token, body));
    }

    @GetMapping("/v1/talkgroups")
    public ResponseEntity<GatewayResponse> getTalkGroups(
            @RequestHeader("X-Access-Token") String token,
            @RequestParam MultiValueMap<String, String> queryParams
    ) {
        return proxyResponseMapper.toJsonResponse(
                helmetApiGateway.get("/v1/talkgroups", token, RequestParamUtils.clean(queryParams))
        );
    }

    @PostMapping("/v1/send-talkgroup-command")
    public ResponseEntity<GatewayResponse> sendTalkGroupCommand(
            @RequestHeader("X-Access-Token") String token,
            @RequestBody JsonNode body
    ) {
        payloadValidationService.validateTalkCommand(body);
        return proxyResponseMapper.toJsonResponse(helmetApiGateway.post("/v1/send-talkgroup-command", token, body));
    }
}
