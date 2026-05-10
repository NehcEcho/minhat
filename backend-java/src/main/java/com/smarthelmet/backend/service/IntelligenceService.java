package com.smarthelmet.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

/**
 * "贾维斯" 智慧型 AI — 通过 Gemini API 生成安全态势短评。
 * 接收 Python 算法端的脑电分析数值（专注度/疲劳度/压力/放松度/警觉性）
 * 以及工矿帽平台的设备与告警统计，生成自然语言风格的情报简报。
 */
@Service
public class IntelligenceService {

    private static final Logger log = LoggerFactory.getLogger(IntelligenceService.class);

    private static final String GEMINI_API_URL = "https://api.gemai.cc/v1/chat/completions";
    private static final String GEMINI_MODEL = "[满血A]gemini-3-pro-preview-maxthinking";
    private static final String GEMINI_API_KEY = "sk-f4eFqnESSGVaD3ZeQ5DfT7M1GKQo5KnxMhdoKexzaGVi059Q";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public IntelligenceService(HttpClient httpClient, ObjectMapper objectMapper) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    /**
     * 生成"贾维斯风格"的安全态势短评。
     *
     * @param eegMetrics   脑电分析指标 (focus, fatigue, stress, relaxation, vigilance, 0-100)
     * @param deviceStats  设备统计 (totalDevices, onlineDevices, offlineDevices)
     * @param alarmStats   告警统计 (totalAlarms, unhandledAlarms, criticalAlarms)
     * @return 贾维斯风格的短评文本
     */
    public String generateBriefing(Map<String, Object> eegMetrics,
                                   Map<String, Object> deviceStats,
                                   Map<String, Object> alarmStats) {
        try {
            String systemPrompt = buildSystemPrompt();
            String userPrompt = buildUserPrompt(eegMetrics, deviceStats, alarmStats);

            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", GEMINI_MODEL);
            requestBody.put("max_tokens", 500);
            requestBody.put("temperature", 0.8);

            ArrayNode messages = requestBody.putArray("messages");

            ObjectNode systemMsg = messages.addObject();
            systemMsg.put("role", "system");
            systemMsg.put("content", systemPrompt);

            ObjectNode userMsg = messages.addObject();
            userMsg.put("role", "user");
            userMsg.put("content", userPrompt);

            String json = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GEMINI_API_URL))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + GEMINI_API_KEY)
                    .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode choices = root.path("choices");
                if (choices.isArray() && !choices.isEmpty()) {
                    String content = choices.get(0).path("message").path("content").asText("");
                    return content.isBlank() ? buildFallbackBriefing(eegMetrics, deviceStats, alarmStats) : content;
                }
            }

            log.warn("Gemini API 返回非200状态: {} — {}", response.statusCode(), response.body());
            return buildFallbackBriefing(eegMetrics, deviceStats, alarmStats);

        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            log.error("Gemini API 调用被中断", ex);
            return buildFallbackBriefing(eegMetrics, deviceStats, alarmStats);
        } catch (IOException ex) {
            log.error("Gemini API 调用失败", ex);
            return buildFallbackBriefing(eegMetrics, deviceStats, alarmStats);
        }
    }

    private String buildSystemPrompt() {
        return """
                你是"贾维斯"——一个服务于矿山安全指挥中心的 AI 助手。
                你的职责是根据脑电数据分析和工矿帽平台的实时数据，用简洁、权威、略带科幻感的口吻，
                输出一段不超过 120 字的中文安全态势简报。
                要求：
                1. 首先概括当前整体安全等级（用"安全""警戒""危险"三个词之一）。
                2. 指出关键风险点（如疲劳度偏高、设备离线、未处理告警等）。
                3. 给出一句简短的行动建议。
                4. 语气像钢铁侠中的贾维斯：冷静、精确、微带幽默。
                """;
    }

    private String buildUserPrompt(Map<String, Object> eegMetrics,
                                   Map<String, Object> deviceStats,
                                   Map<String, Object> alarmStats) {
        return String.format("""
                当前态势数据：
                【脑电分析】专注度=%s, 疲劳度=%s, 压力=%s, 放松度=%s, 警觉性=%s
                【设备状态】在线=%s, 离线=%s, 总数=%s
                【安全告警】总数=%s, 未处理=%s, 紧急=%s
                请生成安全态势简报。
                """,
                eegMetrics.getOrDefault("focus", "N/A"),
                eegMetrics.getOrDefault("fatigue", "N/A"),
                eegMetrics.getOrDefault("stress", "N/A"),
                eegMetrics.getOrDefault("relaxation", "N/A"),
                eegMetrics.getOrDefault("vigilance", "N/A"),
                deviceStats.getOrDefault("onlineDevices", "N/A"),
                deviceStats.getOrDefault("offlineDevices", "N/A"),
                deviceStats.getOrDefault("totalDevices", "N/A"),
                alarmStats.getOrDefault("totalAlarms", "N/A"),
                alarmStats.getOrDefault("unhandledAlarms", "N/A"),
                alarmStats.getOrDefault("criticalAlarms", "N/A"));
    }

    /**
     * Gemini 不可用时的本地回退简报。
     */
    private String buildFallbackBriefing(Map<String, Object> eegMetrics,
                                         Map<String, Object> deviceStats,
                                         Map<String, Object> alarmStats) {
        int fatigue = toInt(eegMetrics.getOrDefault("fatigue", 0));
        int unhandled = toInt(alarmStats.getOrDefault("unhandledAlarms", 0));
        int offline = toInt(deviceStats.getOrDefault("offlineDevices", 0));

        String level = "安全";
        if (fatigue > 70 || unhandled > 5) level = "危险";
        else if (fatigue > 40 || unhandled > 2 || offline > 0) level = "警戒";

        return String.format("Sir，当前安全等级：%s。疲劳指数 %d，%d 条未处理告警，%d 台设备离线。建议立即关注高风险人员状态。",
                level, fatigue, unhandled, offline);
    }

    private int toInt(Object val) {
        if (val instanceof Number n) return n.intValue();
        try { return Integer.parseInt(String.valueOf(val)); } catch (NumberFormatException e) { return 0; }
    }
}
