package com.smarthelmet.backend.config;

import com.smarthelmet.backend.websocket.TalkRelayWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final TalkRelayWebSocketHandler talkRelayWebSocketHandler;

    public WebSocketConfig(TalkRelayWebSocketHandler talkRelayWebSocketHandler) {
        this.talkRelayWebSocketHandler = talkRelayWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(
                talkRelayWebSocketHandler,
                "/ws/talk-relay",
                "/api/proxy/api/v1/control/ws-talk/**"
        )
        .setAllowedOriginPatterns("*");
    }
}
