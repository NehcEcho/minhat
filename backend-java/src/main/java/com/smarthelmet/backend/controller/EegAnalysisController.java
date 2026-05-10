package com.smarthelmet.backend.controller;

import com.smarthelmet.backend.model.ApiResponse;
import com.smarthelmet.backend.model.EegAnalysisQuery;
import com.smarthelmet.backend.model.EegAnalysisRecord;
import com.smarthelmet.backend.model.EegAnalysisTaskRequest;
import com.smarthelmet.backend.model.PageData;
import com.smarthelmet.backend.service.EegAnalysisService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/eeg-analysis")
public class EegAnalysisController {

    private final EegAnalysisService eegAnalysisService;

    public EegAnalysisController(EegAnalysisService eegAnalysisService) {
        this.eegAnalysisService = eegAnalysisService;
    }

    @GetMapping("/records")
    public ResponseEntity<ApiResponse<PageData<EegAnalysisRecord>>> getRecords(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String model,
            @RequestParam(required = false) String result,
            @RequestParam(name = "page_index", defaultValue = "1") int pageIndex,
            @RequestParam(name = "page_size", defaultValue = "5") int pageSize
    ) {
        PageData<EegAnalysisRecord> payload = eegAnalysisService.getRecords(
                new EegAnalysisQuery(keyword, model, result, pageIndex, pageSize)
        );
        return ResponseEntity.ok(new ApiResponse<>("0", "分析结果查询成功", payload));
    }

    @PostMapping("/tasks")
    public ResponseEntity<ApiResponse<EegAnalysisRecord>> createTask(@Valid @RequestBody EegAnalysisTaskRequest request) {
        EegAnalysisRecord payload = eegAnalysisService.createTask(request);
        return ResponseEntity.accepted().body(new ApiResponse<>("0", "分析任务已创建", payload));
    }
}
