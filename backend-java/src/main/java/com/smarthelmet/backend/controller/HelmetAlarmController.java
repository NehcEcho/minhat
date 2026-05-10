package com.smarthelmet.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.smarthelmet.backend.model.GatewayResponse;
import com.smarthelmet.backend.service.HelmetApiGateway;
import com.smarthelmet.backend.support.ProxyResponseMapper;
import com.smarthelmet.backend.util.RequestParamUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/proxy")
public class HelmetAlarmController {

    private final HelmetApiGateway helmetApiGateway;
    private final ProxyResponseMapper proxyResponseMapper;

    public HelmetAlarmController(HelmetApiGateway helmetApiGateway, ProxyResponseMapper proxyResponseMapper) {
        this.helmetApiGateway = helmetApiGateway;
        this.proxyResponseMapper = proxyResponseMapper;
    }

    @GetMapping("/v1/alarms")
    public ResponseEntity<GatewayResponse> getAlarmList(
            @RequestHeader("X-Access-Token") String token,
            @RequestParam MultiValueMap<String, String> queryParams
    ) {
        return proxyResponseMapper.toJsonResponse(
                helmetApiGateway.get("/v1/alarms", token, RequestParamUtils.clean(queryParams))
        );
    }

    @PutMapping("/v1/alarms/{id}")
    public ResponseEntity<GatewayResponse> updateAlarm(
            @RequestHeader("X-Access-Token") String token,
            @PathVariable String id,
            @RequestBody JsonNode body
    ) {
        return proxyResponseMapper.toJsonResponse(helmetApiGateway.put("/v1/alarms/" + id, token, body));
    }
}
