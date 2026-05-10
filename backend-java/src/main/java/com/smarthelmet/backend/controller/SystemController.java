package com.smarthelmet.backend.controller;

import com.smarthelmet.backend.model.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> health() {
        return new ApiResponse<>(
                "0",
                "系统运行正常",
                Map.of(
                        "service", "backend-java",
                        "status", "UP",
                        "time", OffsetDateTime.now().toString()
                )
        );
    }
}
