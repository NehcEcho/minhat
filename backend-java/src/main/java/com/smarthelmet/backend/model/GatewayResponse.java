package com.smarthelmet.backend.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record GatewayResponse(
        boolean success,
        int remoteStatus,
        String message,
        Object payload,
        Instant timestamp
) {

    public static GatewayResponse success(int remoteStatus, Object payload) {
        return new GatewayResponse(true, remoteStatus, "请求成功", payload, Instant.now());
    }

    public static GatewayResponse failure(int remoteStatus, String message, Object payload) {
        return new GatewayResponse(false, remoteStatus, message, payload, Instant.now());
    }
}
