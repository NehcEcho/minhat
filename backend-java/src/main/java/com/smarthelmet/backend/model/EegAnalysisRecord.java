package com.smarthelmet.backend.model;

public record EegAnalysisRecord(
        Long id,
        String resultId,
        String employee,
        AnalysisModelType model,
        AnalysisResultLevel result,
        int confidence,
        String trend,
        String deviceId,
        String dataFilePath,
        double samplingRate,
        String createdAt,
        String updatedAt
) {
}
