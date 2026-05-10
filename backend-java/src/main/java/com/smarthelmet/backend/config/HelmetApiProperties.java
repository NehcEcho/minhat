package com.smarthelmet.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "helmet.api")
public class HelmetApiProperties {

    private String baseUrl = "https://api.znhaas.net:2443";
    private String talkWebsocketBaseUrl = "wss://api.znhaas.net:2443";
    private String livekitServerUrl = "wss://webrtc.znhaas.net";
    private int connectTimeoutSeconds = 10;
    private int readTimeoutSeconds = 60;

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getTalkWebsocketBaseUrl() {
        return talkWebsocketBaseUrl;
    }

    public void setTalkWebsocketBaseUrl(String talkWebsocketBaseUrl) {
        this.talkWebsocketBaseUrl = talkWebsocketBaseUrl;
    }

    public String getLivekitServerUrl() {
        return livekitServerUrl;
    }

    public void setLivekitServerUrl(String livekitServerUrl) {
        this.livekitServerUrl = livekitServerUrl;
    }

    public int getConnectTimeoutSeconds() {
        return connectTimeoutSeconds;
    }

    public void setConnectTimeoutSeconds(int connectTimeoutSeconds) {
        this.connectTimeoutSeconds = connectTimeoutSeconds;
    }

    public int getReadTimeoutSeconds() {
        return readTimeoutSeconds;
    }

    public void setReadTimeoutSeconds(int readTimeoutSeconds) {
        this.readTimeoutSeconds = readTimeoutSeconds;
    }
}
