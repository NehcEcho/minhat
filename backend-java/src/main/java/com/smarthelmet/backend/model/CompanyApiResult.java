package com.smarthelmet.backend.model;

import com.fasterxml.jackson.databind.JsonNode;
import java.net.http.HttpHeaders;

public record CompanyApiResult(
        int statusCode,
        HttpHeaders headers,
        byte[] bodyBytes,
        String rawBody,
        JsonNode jsonBody
) {

    public boolean isSuccessStatus() {
        return statusCode >= 200 && statusCode < 300;
    }
}
