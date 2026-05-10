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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/proxy")
public class HelmetDeviceController {

    private final HelmetApiGateway helmetApiGateway;
    private final ProxyResponseMapper proxyResponseMapper;

    public HelmetDeviceController(HelmetApiGateway helmetApiGateway, ProxyResponseMapper proxyResponseMapper) {
        this.helmetApiGateway = helmetApiGateway;
        this.proxyResponseMapper = proxyResponseMapper;
    }

    @GetMapping("/v1/user/devices")
    public ResponseEntity<GatewayResponse> getCurrentUserDevices(@RequestHeader("X-Access-Token") String token) {
        return proxyResponseMapper.toJsonResponse(helmetApiGateway.get("/v1/user/devices", token, null));
    }

    @GetMapping("/v1/devices")
    public ResponseEntity<GatewayResponse> getDeviceList(
            @RequestHeader("X-Access-Token") String token,
            @RequestParam MultiValueMap<String, String> queryParams
    ) {
        return proxyResponseMapper.toJsonResponse(
                helmetApiGateway.get("/v1/devices", token, RequestParamUtils.clean(queryParams))
        );
    }

    @GetMapping("/v1/devices/{id}")
    public ResponseEntity<GatewayResponse> getDeviceById(
            @RequestHeader("X-Access-Token") String token,
            @PathVariable String id
    ) {
        return proxyResponseMapper.toJsonResponse(helmetApiGateway.get("/v1/devices/" + id, token, null));
    }

    @PutMapping("/v1/devices/{id}")
    public ResponseEntity<GatewayResponse> updateDevice(
            @RequestHeader("X-Access-Token") String token,
            @PathVariable String id,
            @RequestBody JsonNode body
    ) {
        return proxyResponseMapper.toJsonResponse(helmetApiGateway.put("/v1/devices/" + id, token, body));
    }

    @GetMapping("/v1/device/file")
    public ResponseEntity<GatewayResponse> getDeviceFiles(
            @RequestHeader("X-Access-Token") String token,
            @RequestParam MultiValueMap<String, String> queryParams
    ) {
        return proxyResponseMapper.toJsonResponse(
                helmetApiGateway.get("/v1/device/file", token, RequestParamUtils.clean(queryParams))
        );
    }

    @PostMapping("/v1/device/file/delete")
    public ResponseEntity<GatewayResponse> deleteDeviceFile(
            @RequestHeader("X-Access-Token") String token,
            @RequestBody JsonNode body
    ) {
        return proxyResponseMapper.toJsonResponse(helmetApiGateway.post("/v1/device/file/delete", token, body));
    }

    @GetMapping("/v1/locations")
    public ResponseEntity<GatewayResponse> getLocations(
            @RequestHeader("X-Access-Token") String token,
            @RequestParam MultiValueMap<String, String> queryParams
    ) {
        return proxyResponseMapper.toJsonResponse(
                helmetApiGateway.get("/v1/locations", token, RequestParamUtils.clean(queryParams))
        );
    }
}
