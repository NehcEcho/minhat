package com.smarthelmet.backend.websocket;

import com.smarthelmet.backend.config.HelmetApiProperties;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.nio.ByteBuffer;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class TalkRelayWebSocketHandler extends TextWebSocketHandler {

    private final HttpClient httpClient;
    private final HelmetApiProperties properties;
    private final Map<String, WebSocket> remoteSockets = new ConcurrentHashMap<>();

    public TalkRelayWebSocketHandler(HttpClient httpClient, HelmetApiProperties properties) {
        this.httpClient = httpClient;
        this.properties = properties;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        URI localUri = session.getUri();
        if (localUri == null) {
            session.close(CloseStatus.BAD_DATA.withReason("缺少连接参数"));
            return;
        }
        MultiValueMap<String, String> queryParams = UriComponentsBuilder.fromUri(localUri).build().getQueryParams();
        String serial = queryParams.getFirst("serial");
        String code = queryParams.getFirst("code");
        String token = queryParams.getFirst("token");
        String format = queryParams.getFirst("format") == null ? "pcm" : queryParams.getFirst("format");

        if ((isBlank(serial) || isBlank(code)) && localUri.getPath() != null
                && localUri.getPath().contains("/api/proxy/api/v1/control/ws-talk/")) {
            String[] segments = localUri.getPath().split("/");
            if (segments.length >= 2) {
                code = segments[segments.length - 1];
                serial = segments[segments.length - 2];
            }
        }

        if (isBlank(serial) || isBlank(code) || isBlank(token)) {
            session.close(CloseStatus.BAD_DATA.withReason("serial、code、token 不能为空"));
            return;
        }

        URI remoteUri = UriComponentsBuilder.fromUriString(properties.getTalkWebsocketBaseUrl())
                .path("/api/v1/control/ws-talk/{serial}/{code}")
                .queryParam("format", format)
                .queryParam("token", token)
                .buildAndExpand(serial, code)
                .toUri();

        try {
            WebSocket remoteSocket = httpClient.newWebSocketBuilder()
                    .connectTimeout(Duration.ofSeconds(properties.getConnectTimeoutSeconds()))
                    .buildAsync(remoteUri, new RelayListener(session))
                    .join();
            remoteSockets.put(session.getId(), remoteSocket);
        } catch (Exception ex) {
            session.close(CloseStatus.SERVER_ERROR.withReason("连接远端语音喊话通道失败"));
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        WebSocket remoteSocket = remoteSockets.get(session.getId());
        if (remoteSocket != null) {
            remoteSocket.sendText(message.getPayload(), true);
        }
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) {
        WebSocket remoteSocket = remoteSockets.get(session.getId());
        if (remoteSocket != null) {
            remoteSocket.sendBinary(message.getPayload(), true);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        WebSocket remoteSocket = remoteSockets.remove(session.getId());
        if (remoteSocket != null) {
            remoteSocket.sendClose(status.getCode(), status.getReason() == null ? "closed" : status.getReason());
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static final class RelayListener implements WebSocket.Listener {

        private final WebSocketSession localSession;

        private RelayListener(WebSocketSession localSession) {
            this.localSession = localSession;
        }

        @Override
        public void onOpen(WebSocket webSocket) {
            webSocket.request(1);
        }

        @Override
        public CompletionStage<?> onText(WebSocket webSocket, CharSequence data, boolean last) {
            try {
                if (localSession.isOpen()) {
                    localSession.sendMessage(new TextMessage(data.toString()));
                }
            } catch (IOException ignored) {
            }
            webSocket.request(1);
            return CompletableFuture.completedFuture(null);
        }

        @Override
        public CompletionStage<?> onBinary(WebSocket webSocket, ByteBuffer data, boolean last) {
            try {
                if (localSession.isOpen()) {
                    localSession.sendMessage(new BinaryMessage(data));
                }
            } catch (IOException ignored) {
            }
            webSocket.request(1);
            return CompletableFuture.completedFuture(null);
        }

        @Override
        public CompletionStage<?> onClose(WebSocket webSocket, int statusCode, String reason) {
            try {
                if (localSession.isOpen()) {
                    localSession.close(new CloseStatus(statusCode, reason == null ? "" : reason));
                }
            } catch (IOException ignored) {
            }
            return CompletableFuture.completedFuture(null);
        }

        @Override
        public void onError(WebSocket webSocket, Throwable error) {
            try {
                if (localSession.isOpen()) {
                    localSession.close(new CloseStatus(1011, "远端语音喊话连接异常"));
                }
            } catch (IOException ignored) {
            }
        }
    }
}
