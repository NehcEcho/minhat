package com.smarthelmet.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.smarthelmet.backend.model.ApiResponse;
import com.smarthelmet.backend.model.PageData;
import com.smarthelmet.backend.model.PlatformSnapshotSyncRequest;
import com.smarthelmet.backend.model.PlatformSnapshotSyncResult;
import com.smarthelmet.backend.model.PlatformSnapshotSummary;
import com.smarthelmet.backend.service.PlatformSnapshotService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/platform-cache")
public class PlatformSnapshotController {

    private final PlatformSnapshotService platformSnapshotService;

    public PlatformSnapshotController(PlatformSnapshotService platformSnapshotService) {
        this.platformSnapshotService = platformSnapshotService;
    }

    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<PlatformSnapshotSyncResult>> sync(
            @RequestHeader("X-Access-Token") String token,
            @RequestBody(required = false) PlatformSnapshotSyncRequest request
    ) {
        PlatformSnapshotSyncResult payload = platformSnapshotService.sync(token, request);
        return ResponseEntity.ok(new ApiResponse<>("0", "平台镜像同步成功", payload));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<PlatformSnapshotSummary>> getSummary(
            @RequestHeader("X-Access-Token") String token
    ) {
        PlatformSnapshotSummary payload = platformSnapshotService.getSummary();
        return ResponseEntity.ok(new ApiResponse<>("0", "平台镜像汇总查询成功", payload));
    }

    @GetMapping("/user/devices")
    public ResponseEntity<ApiResponse<JsonNode>> getGroupedDevices(
            @RequestHeader("X-Access-Token") String token,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status
    ) {
        JsonNode payload = platformSnapshotService.getGroupedDevices(keyword, status);
        return ResponseEntity.ok(new ApiResponse<>("0", "本地设备分组查询成功", payload));
    }

    @GetMapping("/devices")
    public ResponseEntity<ApiResponse<PageData<JsonNode>>> getDevicePage(
            @RequestHeader("X-Access-Token") String token,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(name = "page_index", defaultValue = "1") int pageIndex,
            @RequestParam(name = "page_size", defaultValue = "20") int pageSize
    ) {
        PageData<JsonNode> payload = platformSnapshotService.getDevicePage(keyword, status, pageIndex, pageSize);
        return ResponseEntity.ok(new ApiResponse<>("0", "本地设备快照查询成功", payload));
    }

    @GetMapping("/alarms")
    public ResponseEntity<ApiResponse<PageData<JsonNode>>> getAlarmPage(
            @RequestHeader("X-Access-Token") String token,
            @RequestParam(required = false) String keyword,
            @RequestParam(name = "device_id", required = false) String deviceId,
            @RequestParam(name = "event_code", required = false) String eventCode,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) Boolean handled,
            @RequestParam(name = "start_time", required = false) Long startTime,
            @RequestParam(name = "end_time", required = false) Long endTime,
            @RequestParam(name = "page_index", defaultValue = "1") int pageIndex,
            @RequestParam(name = "page_size", defaultValue = "20") int pageSize
    ) {
        PageData<JsonNode> payload = platformSnapshotService.getAlarmPage(
                keyword,
                deviceId,
                eventCode,
                level,
                handled,
                startTime,
                endTime,
                pageIndex,
                pageSize
        );
        return ResponseEntity.ok(new ApiResponse<>("0", "本地告警快照查询成功", payload));
    }

    @GetMapping("/locations")
    public ResponseEntity<ApiResponse<List<JsonNode>>> getLocations(
            @RequestHeader("X-Access-Token") String token,
            @RequestParam(name = "device_id", required = false) String deviceId,
            @RequestParam(name = "start_time", required = false) Long startTime,
            @RequestParam(name = "end_time", required = false) Long endTime,
            @RequestParam(defaultValue = "500") int limit
    ) {
        List<JsonNode> payload = platformSnapshotService.getLocations(deviceId, startTime, endTime, limit);
        return ResponseEntity.ok(new ApiResponse<>("0", "本地轨迹快照查询成功", payload));
    }
}
