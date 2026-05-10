package com.smarthelmet.backend.model;

public record EegAnalysisQuery(
        String keyword,
        String model,
        String result,
        int pageIndex,
        int pageSize
) {
}
