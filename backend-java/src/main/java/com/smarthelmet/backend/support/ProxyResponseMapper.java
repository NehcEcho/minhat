package com.smarthelmet.backend.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.NullNode;
import com.smarthelmet.backend.model.CompanyApiResult;
import com.smarthelmet.backend.model.GatewayResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

@Component
public class ProxyResponseMapper {

    public ResponseEntity<GatewayResponse> toJsonResponse(CompanyApiResult result) {
        Object payload = extractPayload(result);
        GatewayResponse response = result.isSuccessStatus()
                ? GatewayResponse.success(result.statusCode(), payload)
                : GatewayResponse.failure(result.statusCode(), "帽子平台接口调用失败", payload);
        return ResponseEntity.status(result.statusCode()).body(response);
    }

    public ResponseEntity<?> toDownloadResponse(CompanyApiResult result, String fallbackFilename) {
        if (!result.isSuccessStatus()) {
            return ResponseEntity.status(result.statusCode())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(GatewayResponse.failure(result.statusCode(), "帽子平台接口调用失败", extractPayload(result)));
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(resolveContentType(result));
        headers.setContentLength(result.bodyBytes().length);
        headers.set(HttpHeaders.CONTENT_DISPOSITION,
                result.headers().firstValue(HttpHeaders.CONTENT_DISPOSITION)
                        .orElse("attachment; filename=\"" + fallbackFilename + "\""));
        return new ResponseEntity<>(result.bodyBytes(), headers, HttpStatusCode.valueOf(result.statusCode()));
    }

    private Object extractPayload(CompanyApiResult result) {
        JsonNode jsonBody = result.jsonBody();
        if (jsonBody != null && jsonBody != NullNode.getInstance() && !jsonBody.isNull()) {
            return jsonBody;
        }
        if (result.rawBody() != null && !result.rawBody().isBlank()) {
            return result.rawBody();
        }
        return null;
    }

    private MediaType resolveContentType(CompanyApiResult result) {
        try {
            return result.headers().firstValue(HttpHeaders.CONTENT_TYPE)
                    .map(MediaType::parseMediaType)
                    .orElse(MediaType.APPLICATION_OCTET_STREAM);
        } catch (IllegalArgumentException ex) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }
}
