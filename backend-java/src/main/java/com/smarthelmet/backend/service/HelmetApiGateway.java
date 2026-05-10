package com.smarthelmet.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import com.smarthelmet.backend.config.HelmetApiProperties;
import com.smarthelmet.backend.exception.RemoteApiException;
import com.smarthelmet.backend.model.CompanyApiResult;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class HelmetApiGateway {

    private final HelmetApiProperties properties;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public HelmetApiGateway(HelmetApiProperties properties, HttpClient httpClient, ObjectMapper objectMapper) {
        this.properties = properties;
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    public CompanyApiResult login(String username, String password) {
        String basicToken = Base64.getEncoder()
                .encodeToString((username + ":" + password).getBytes(StandardCharsets.UTF_8));
        return exchange(HttpMethod.POST, "/login", null, null, null, Map.of("Authorization", "Basic " + basicToken));
    }

    public CompanyApiResult get(String path, String token, MultiValueMap<String, String> queryParams) {
        return exchange(HttpMethod.GET, path, token, queryParams, null, null);
    }

    public CompanyApiResult post(String path, String token, JsonNode body) {
        return exchange(HttpMethod.POST, path, token, null, body, null);
    }

    public CompanyApiResult post(String path, String token, MultiValueMap<String, String> queryParams, JsonNode body) {
        return exchange(HttpMethod.POST, path, token, queryParams, body, null);
    }

    public CompanyApiResult put(String path, String token, JsonNode body) {
        return exchange(HttpMethod.PUT, path, token, null, body, null);
    }

    public CompanyApiResult delete(String path, String token, MultiValueMap<String, String> queryParams) {
        return exchange(HttpMethod.DELETE, path, token, queryParams, null, null);
    }

    public CompanyApiResult download(String path, String token) {
        return exchange(HttpMethod.GET, path, token, null, null, null);
    }

    private CompanyApiResult exchange(
            HttpMethod method,
            String path,
            String token,
            MultiValueMap<String, String> queryParams,
            JsonNode body,
            Map<String, String> extraHeaders
    ) {
        try {
            URI uri = buildUri(path, queryParams);
            HttpRequest.Builder builder = HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofSeconds(properties.getReadTimeoutSeconds()))
                    .header("Accept", "application/json, text/plain, */*");

            if (token != null && !token.isBlank()) {
                builder.header("Authorization", "Bearer " + token.trim());
            }
            if (extraHeaders != null) {
                extraHeaders.forEach(builder::header);
            }
            applyMethod(builder, method, body);

            HttpResponse<byte[]> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofByteArray());
            byte[] responseBytes = response.body() == null ? new byte[0] : response.body();
            String rawBody = decodeTextBody(response.headers().map(), responseBytes);
            JsonNode jsonBody = parseJsonBody(response.headers().map(), rawBody);
            return new CompanyApiResult(response.statusCode(), response.headers(), responseBytes, rawBody, jsonBody);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new RemoteApiException("调用帽子平台接口失败", ex);
        } catch (IOException ex) {
            throw new RemoteApiException("调用帽子平台接口失败", ex);
        }
    }

    private void applyMethod(HttpRequest.Builder builder, HttpMethod method, JsonNode body) throws IOException {
        if (method == HttpMethod.GET) {
            builder.GET();
            return;
        }
        if (method == HttpMethod.DELETE) {
            builder.DELETE();
            return;
        }
        if (body == null || body.isNull() || body == NullNode.getInstance()) {
            if (method == HttpMethod.POST) {
                builder.POST(HttpRequest.BodyPublishers.noBody());
                return;
            }
            if (method == HttpMethod.PUT) {
                builder.PUT(HttpRequest.BodyPublishers.noBody());
                return;
            }
        }
        String json = objectMapper.writeValueAsString(body);
        builder.header("Content-Type", "application/json");
        if (method == HttpMethod.POST) {
            builder.POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8));
            return;
        }
        if (method == HttpMethod.PUT) {
            builder.PUT(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8));
            return;
        }
        throw new RemoteApiException("暂不支持的请求方法: " + method);
    }

    private URI buildUri(String path, MultiValueMap<String, String> queryParams) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(properties.getBaseUrl()).path(path);
        if (queryParams != null) {
            for (Map.Entry<String, List<String>> entry : queryParams.entrySet()) {
                for (String value : entry.getValue()) {
                    builder.queryParam(entry.getKey(), value);
                }
            }
        }
        return builder.build(true).toUri();
    }

    private String decodeTextBody(Map<String, List<String>> headers, byte[] bodyBytes) {
        if (bodyBytes == null || bodyBytes.length == 0) {
            return null;
        }
        String contentType = findHeader(headers, "content-type");
        if (contentType == null || isTextLike(contentType)) {
            return new String(bodyBytes, StandardCharsets.UTF_8);
        }
        return null;
    }

    private JsonNode parseJsonBody(Map<String, List<String>> headers, String rawBody) {
        if (rawBody == null || rawBody.isBlank()) {
            return NullNode.getInstance();
        }
        String contentType = findHeader(headers, "content-type");
        String trimmed = rawBody.trim();
        boolean jsonLike = contentType != null && contentType.toLowerCase().contains("json");
        if (!jsonLike && !(trimmed.startsWith("{") || trimmed.startsWith("["))) {
            return NullNode.getInstance();
        }
        try {
            return objectMapper.readTree(rawBody);
        } catch (IOException ex) {
            return NullNode.getInstance();
        }
    }

    private boolean isTextLike(String contentType) {
        String normalized = contentType.toLowerCase();
        return normalized.startsWith("text/")
                || normalized.contains("json")
                || normalized.contains("xml")
                || normalized.contains("javascript")
                || normalized.contains("charset");
    }

    private String findHeader(Map<String, List<String>> headers, String key) {
        for (Map.Entry<String, List<String>> entry : headers.entrySet()) {
            if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(key) && !entry.getValue().isEmpty()) {
                return entry.getValue().get(0);
            }
        }
        return null;
    }
}
