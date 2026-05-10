package com.smarthelmet.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.smarthelmet.backend.service.HelmetApiGateway;
import com.smarthelmet.backend.support.ProxyResponseMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/proxy")
public class HelmetRtcController {

    private final HelmetApiGateway helmetApiGateway;
    private final ProxyResponseMapper proxyResponseMapper;

    public HelmetRtcController(HelmetApiGateway helmetApiGateway, ProxyResponseMapper proxyResponseMapper) {
        this.helmetApiGateway = helmetApiGateway;
        this.proxyResponseMapper = proxyResponseMapper;
    }

    @GetMapping("/bvcsp/v1/pu/info/{puid}")
    public ResponseEntity<?> getPuInfo(
            @RequestHeader("X-Access-Token") String token,
            @PathVariable String puid
    ) {
        return proxyResponseMapper.toJsonResponse(helmetApiGateway.get("/bvcsp/v1/pu/info/" + puid, token, null));
    }

    @PostMapping("/bvcsp/v1/dialog/device/bvrtc")
    public ResponseEntity<?> openBvrtcDialog(
            @RequestHeader("X-Access-Token") String token,
            @RequestBody JsonNode body
    ) {
        return proxyResponseMapper.toJsonResponse(helmetApiGateway.post("/bvcsp/v1/dialog/device/bvrtc", token, body));
    }

    @PostMapping("/bvcsp/v1/recordfile/filter")
    public ResponseEntity<?> filterPlatformRecordFiles(
            @RequestHeader("X-Access-Token") String token,
            @RequestBody JsonNode body
    ) {
        return proxyResponseMapper.toJsonResponse(helmetApiGateway.post("/bvcsp/v1/recordfile/filter", token, body));
    }

    @PostMapping("/bvcsp/v1/pu/recordfile/filter/{puid}")
    public ResponseEntity<?> filterDeviceRecordFiles(
            @RequestHeader("X-Access-Token") String token,
            @PathVariable String puid,
            @RequestBody JsonNode body
    ) {
        return proxyResponseMapper.toJsonResponse(
                helmetApiGateway.post("/bvcsp/v1/pu/recordfile/filter/" + puid, token, body)
        );
    }

    @GetMapping("/bvnru/v1/download/{fileid}")
    public ResponseEntity<?> downloadPlatformFile(
            @RequestHeader("X-Access-Token") String token,
            @PathVariable String fileid
    ) {
        return proxyResponseMapper.toDownloadResponse(
                helmetApiGateway.download("/bvnru/v1/download/" + fileid, token),
                fileid + ".bin"
        );
    }

    @GetMapping("/bvnru/v1/pu/download/{puid}/{fileid}")
    public ResponseEntity<?> downloadDeviceFile(
            @RequestHeader("X-Access-Token") String token,
            @PathVariable String puid,
            @PathVariable String fileid
    ) {
        return proxyResponseMapper.toDownloadResponse(
                helmetApiGateway.download("/bvnru/v1/pu/download/" + puid + "/" + fileid, token),
                fileid + ".bin"
        );
    }
}
