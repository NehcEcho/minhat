package com.smarthelmet.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.smarthelmet.backend.dto.HelmetLoginRequest;
import com.smarthelmet.backend.model.GatewayResponse;
import com.smarthelmet.backend.service.HelmetApiGateway;
import com.smarthelmet.backend.support.ProxyResponseMapper;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/proxy")
public class HelmetAuthController {

    private final HelmetApiGateway helmetApiGateway;
    private final ProxyResponseMapper proxyResponseMapper;

    public HelmetAuthController(HelmetApiGateway helmetApiGateway, ProxyResponseMapper proxyResponseMapper) {
        this.helmetApiGateway = helmetApiGateway;
        this.proxyResponseMapper = proxyResponseMapper;
    }

    @PostMapping("/login")
    public ResponseEntity<GatewayResponse> login(@Valid @RequestBody HelmetLoginRequest request) {
        return proxyResponseMapper.toJsonResponse(helmetApiGateway.login(request.username(), request.password()));
    }

    @GetMapping("/v1/user")
    public ResponseEntity<GatewayResponse> getCurrentUser(@RequestHeader("X-Access-Token") String token) {
        return proxyResponseMapper.toJsonResponse(helmetApiGateway.get("/v1/user", token, null));
    }

    @PutMapping("/v1/users/{username}/password")
    public ResponseEntity<GatewayResponse> updatePassword(
            @RequestHeader("X-Access-Token") String token,
            @PathVariable String username,
            @RequestBody JsonNode body
    ) {
        return proxyResponseMapper.toJsonResponse(
                helmetApiGateway.put("/v1/users/" + username + "/password", token, body)
        );
    }
}
