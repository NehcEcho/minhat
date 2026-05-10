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
public class HelmetFenceController {

    private final HelmetApiGateway helmetApiGateway;
    private final PayloadValidationService payloadValidationService;
    private final ProxyResponseMapper proxyResponseMapper;

    public HelmetFenceController(
            HelmetApiGateway helmetApiGateway,
            PayloadValidationService payloadValidationService,
            ProxyResponseMapper proxyResponseMapper
    ) {
        this.helmetApiGateway = helmetApiGateway;
        this.payloadValidationService = payloadValidationService;
        this.proxyResponseMapper = proxyResponseMapper;
    }

    @PostMapping("/v1/fences")
    public ResponseEntity<GatewayResponse> createFence(
            @RequestHeader("X-Access-Token") String token,
            @RequestBody JsonNode body
    ) {
        payloadValidationService.validateFencePayload(body, true);
        return proxyResponseMapper.toJsonResponse(helmetApiGateway.post("/v1/fences", token, body));
    }

    @PutMapping("/v1/fences/{id}")
    public ResponseEntity<GatewayResponse> updateFence(
            @RequestHeader("X-Access-Token") String token,
            @PathVariable String id,
            @RequestBody JsonNode body
    ) {
        payloadValidationService.validateFencePayload(body, false);
        return proxyResponseMapper.toJsonResponse(helmetApiGateway.put("/v1/fences/" + id, token, body));
    }

    @DeleteMapping("/v1/fences/{id}")
    public ResponseEntity<GatewayResponse> deleteFence(
            @RequestHeader("X-Access-Token") String token,
            @PathVariable String id
    ) {
        return proxyResponseMapper.toJsonResponse(helmetApiGateway.delete("/v1/fences/" + id, token, null));
    }

    @GetMapping("/v1/fences/{id}")
    public ResponseEntity<GatewayResponse> getFenceById(
            @RequestHeader("X-Access-Token") String token,
            @PathVariable String id
    ) {
        return proxyResponseMapper.toJsonResponse(helmetApiGateway.get("/v1/fences/" + id, token, null));
    }

    @GetMapping("/v1/fences")
    public ResponseEntity<GatewayResponse> getFenceList(
            @RequestHeader("X-Access-Token") String token,
            @RequestParam MultiValueMap<String, String> queryParams
    ) {
        return proxyResponseMapper.toJsonResponse(
                helmetApiGateway.get("/v1/fences", token, RequestParamUtils.clean(queryParams))
        );
    }
}
