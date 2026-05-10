package com.smarthelmet.backend.model;

public record PlatformSnapshotDomainSummary(
        int total,
        String lastSyncedAt,
        String latestDataTime
) {
}
