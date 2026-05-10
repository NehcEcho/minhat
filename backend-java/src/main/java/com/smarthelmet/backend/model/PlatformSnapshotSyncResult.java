package com.smarthelmet.backend.model;

public record PlatformSnapshotSyncResult(
        int totalDeviceCount,
        int totalAlarmCount,
        int totalLocationCount,
        int syncedDeviceCount,
        int syncedAlarmCount,
        int syncedLocationCount,
        long startTime,
        long endTime,
        String syncedAt
) {
}
