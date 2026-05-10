package com.smarthelmet.backend.controller;

import com.smarthelmet.backend.model.ApiResponse;
import com.smarthelmet.backend.service.IntelligenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * "贾维斯"智慧 AI 接口 — 供前端指挥中心调用。
 * POST /api/intelligence/briefing  → 生成安全态势短评
 * GET  /api/intelligence/status    → 服务状态检查
 */
@RestController
@RequestMapping("/api/intelligence")
public class IntelligenceController {

    private final IntelligenceService intelligenceService;

    public IntelligenceController(IntelligenceService intelligenceService) {
        this.intelligenceService = intelligenceService;
    }

    /**
     * 生成安全态势短评。
     * 请求体示例：
     * {
     *   "eegMetrics": { "focus": 72, "fatigue": 28, "stress": 35, "relaxation": 60, "vigilance": 55 },
     *   "deviceStats": { "totalDevices": 10, "onlineDevices": 8, "offlineDevices": 2 },
     *   "alarmStats": { "totalAlarms": 15, "unhandledAlarms": 3, "criticalAlarms": 1 }
     * }
     */
    @PostMapping("/briefing")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateBriefing(
            @RequestBody Map<String, Map<String, Object>> request) {

        Map<String, Object> eegMetrics = request.getOrDefault("eegMetrics", Map.of());
        Map<String, Object> deviceStats = request.getOrDefault("deviceStats", Map.of());
        Map<String, Object> alarmStats = request.getOrDefault("alarmStats", Map.of());

        String briefing = intelligenceService.generateBriefing(eegMetrics, deviceStats, alarmStats);

        return ResponseEntity.ok(new ApiResponse<>("0", "简报生成成功",
                Map.of("briefing", briefing)));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, String>>> status() {
        return ResponseEntity.ok(new ApiResponse<>("0", "贾维斯在线",
                Map.of("service", "intelligence", "status", "ONLINE", "model", "[满血A]gemini-3-pro-preview-maxthinking")));
    }
}
