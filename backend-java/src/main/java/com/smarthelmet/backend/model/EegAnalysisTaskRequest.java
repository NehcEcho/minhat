package com.smarthelmet.backend.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record EegAnalysisTaskRequest(
        @NotBlank String employeeId,
        @NotBlank String deviceId,
        @NotBlank String dataFilePath,
        @NotNull @Positive Double samplingRate
) {
}
