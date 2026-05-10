package com.smarthelmet.backend.model;

public record PlatformSnapshotSummary(
        PlatformSnapshotDomainSummary devices,
        PlatformSnapshotDomainSummary alarms,
        PlatformSnapshotDomainSummary locations,
        int handledAlarmCount,
        int pendingAlarmCount,
        String lastSyncedAt
) {
}
