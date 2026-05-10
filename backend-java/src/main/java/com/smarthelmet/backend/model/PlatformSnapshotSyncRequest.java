package com.smarthelmet.backend.model;

public record PlatformSnapshotSyncRequest(
        Boolean syncDevices,
        Boolean syncAlarms,
        Boolean syncLocations,
        String deviceId,
        Long startTime,
        Long endTime,
        Integer alarmPageSize
) {
}
