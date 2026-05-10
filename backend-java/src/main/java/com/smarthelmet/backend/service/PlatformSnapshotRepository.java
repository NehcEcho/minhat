package com.smarthelmet.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smarthelmet.backend.model.GroupedDeviceSnapshot;
import com.smarthelmet.backend.model.PageData;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PlatformSnapshotRepository {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public PlatformSnapshotRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public void upsertDevice(Long groupId, String groupName, JsonNode device) {
        String now = OffsetDateTime.now().toString();
        jdbcTemplate.update(
                """
                INSERT INTO device_snapshots (
                    group_id, group_name, device_index_id, device_id, device_name,
                    company_id, company_name, product_id, product_code, product_name,
                    status, longitude, latitude, latest_data_json, protocols_json,
                    raw_json, source_updated_at, synced_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(device_id) DO UPDATE SET
                    group_id = excluded.group_id,
                    group_name = excluded.group_name,
                    device_index_id = excluded.device_index_id,
                    device_name = excluded.device_name,
                    company_id = excluded.company_id,
                    company_name = excluded.company_name,
                    product_id = excluded.product_id,
                    product_code = excluded.product_code,
                    product_name = excluded.product_name,
                    status = excluded.status,
                    longitude = excluded.longitude,
                    latitude = excluded.latitude,
                    latest_data_json = excluded.latest_data_json,
                    protocols_json = excluded.protocols_json,
                    raw_json = excluded.raw_json,
                    source_updated_at = excluded.source_updated_at,
                    synced_at = excluded.synced_at,
                    updated_at = excluded.updated_at
                """,
                groupId,
                emptyToNull(groupName),
                longValue(device.get("id")),
                textValue(device.get("deviceId")),
                textValue(device.get("deviceName")),
                longValue(device.get("companyId")),
                textValue(device.get("companyName")),
                longValue(device.get("productId")),
                textValue(device.get("productCode")),
                textValue(device.get("productName")),
                textValue(device.get("status")),
                textValue(device.get("longitude")),
                textValue(device.get("latitude")),
                stringifyNullable(device.get("latestData")),
                stringifyNullable(device.get("protocol")),
                stringify(device),
                textValue(device.get("updatedAt")),
                now,
                now,
                now
        );
    }

    public void upsertAlarm(JsonNode alarm) {
        String now = OffsetDateTime.now().toString();
        jdbcTemplate.update(
                """
                INSERT INTO alarm_snapshots (
                    alarm_id, company_id, device_index_id, device_id, device_name,
                    alarm_name, alarm_time, handle_by, handle_at, level, status,
                    event_code, fence_id, handled, raw_json, synced_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(alarm_id) DO UPDATE SET
                    company_id = excluded.company_id,
                    device_index_id = excluded.device_index_id,
                    device_id = excluded.device_id,
                    device_name = excluded.device_name,
                    alarm_name = excluded.alarm_name,
                    alarm_time = excluded.alarm_time,
                    handle_by = excluded.handle_by,
                    handle_at = excluded.handle_at,
                    level = excluded.level,
                    status = excluded.status,
                    event_code = excluded.event_code,
                    fence_id = excluded.fence_id,
                    handled = excluded.handled,
                    raw_json = excluded.raw_json,
                    synced_at = excluded.synced_at,
                    updated_at = excluded.updated_at
                """,
                longValue(alarm.get("id")),
                longValue(alarm.get("companyId")),
                longValue(alarm.get("deviceIndexId")),
                textValue(alarm.get("deviceId")),
                textValue(alarm.get("deviceName")),
                textValue(alarm.get("alarmName")),
                longValue(alarm.get("alarmTime")),
                textValue(alarm.get("handleBy")),
                longValue(alarm.get("handleAt")),
                textValue(alarm.get("level")),
                textValue(alarm.get("status")),
                textValue(alarm.get("eventCode")),
                longValue(alarm.get("fenceId")),
                isHandled(alarm) ? 1 : 0,
                stringify(alarm),
                now,
                now,
                now
        );
    }

    public void upsertLocation(String deviceId, long recordedAt, JsonNode point) {
        String now = OffsetDateTime.now().toString();
        jdbcTemplate.update(
                """
                INSERT INTO location_points (
                    device_id, longitude, latitude, recorded_at, level,
                    event_code, nearby_electric_state, raw_json, synced_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(device_id, recorded_at, longitude, latitude) DO UPDATE SET
                    level = excluded.level,
                    event_code = excluded.event_code,
                    nearby_electric_state = excluded.nearby_electric_state,
                    raw_json = excluded.raw_json,
                    synced_at = excluded.synced_at,
                    updated_at = excluded.updated_at
                """,
                deviceId,
                textValue(point.get("longitude")),
                textValue(point.get("latitude")),
                recordedAt,
                textValue(point.get("fixLevel")),
                textValue(point.get("eventCode")),
                longValue(point.get("nearbyElectricState")),
                stringify(point),
                now,
                now,
                now
        );
    }

    public List<String> findAllDeviceIds() {
        return jdbcTemplate.query(
                "SELECT device_id FROM device_snapshots WHERE device_id IS NOT NULL AND device_id <> '' ORDER BY group_name ASC, device_name ASC, device_id ASC",
                (rs, rowNum) -> rs.getString("device_id")
        );
    }

    public int countDevices() {
        return countAsInt("SELECT COUNT(1) FROM device_snapshots");
    }

    public int countAlarms() {
        return countAsInt("SELECT COUNT(1) FROM alarm_snapshots");
    }

    public int countLocations() {
        return countAsInt("SELECT COUNT(1) FROM location_points");
    }

    public int countHandledAlarms() {
        return countAsInt("SELECT COUNT(1) FROM alarm_snapshots WHERE handled = 1");
    }

    public String findLastDeviceSyncedAt() {
        return queryForString("SELECT MAX(synced_at) FROM device_snapshots");
    }

    public String findLastAlarmSyncedAt() {
        return queryForString("SELECT MAX(synced_at) FROM alarm_snapshots");
    }

    public String findLastLocationSyncedAt() {
        return queryForString("SELECT MAX(synced_at) FROM location_points");
    }

    public String findLatestDeviceSourceUpdatedAt() {
        return queryForString("SELECT MAX(source_updated_at) FROM device_snapshots");
    }

    public Long findLatestAlarmTime() {
        return queryForLong("SELECT MAX(alarm_time) FROM alarm_snapshots");
    }

    public Long findLatestLocationRecordedAt() {
        return queryForLong("SELECT MAX(recorded_at) FROM location_points");
    }

    public List<GroupedDeviceSnapshot> findGroupedDevices(String keyword, String status) {
        List<Object> args = new ArrayList<>();
        String whereClause = buildDeviceWhereClause(keyword, status, args);
        return jdbcTemplate.query(
                """
                SELECT group_id, group_name, raw_json
                FROM device_snapshots
                """ + whereClause + " ORDER BY group_name ASC, device_name ASC, device_id ASC",
                (rs, rowNum) -> new GroupedDeviceSnapshot(
                        nullableLong(rs.getObject("group_id")),
                        rs.getString("group_name"),
                        parseJson(rs.getString("raw_json"))
                ),
                args.toArray()
        );
    }

    public PageData<JsonNode> findDevicePage(String keyword, String status, int pageIndex, int pageSize) {
        List<Object> args = new ArrayList<>();
        String whereClause = buildDeviceWhereClause(keyword, status, args);
        long totalCount = count("SELECT COUNT(1) FROM device_snapshots" + whereClause, args);
        int safePageSize = Math.max(1, pageSize);
        int pageCount = Math.max(1, (int) Math.ceil(totalCount / (double) safePageSize));
        int safePageIndex = Math.max(1, Math.min(pageIndex, pageCount));
        int offset = (safePageIndex - 1) * safePageSize;

        List<Object> listArgs = new ArrayList<>(args);
        listArgs.add(safePageSize);
        listArgs.add(offset);

        List<JsonNode> items = jdbcTemplate.query(
                """
                SELECT raw_json
                FROM device_snapshots
                """ + whereClause + " ORDER BY updated_at DESC, device_id ASC LIMIT ? OFFSET ?",
                (rs, rowNum) -> parseJson(rs.getString("raw_json")),
                listArgs.toArray()
        );

        return new PageData<>(safePageIndex, safePageSize, pageCount, totalCount, items);
    }

    public PageData<JsonNode> findAlarmPage(
            String keyword,
            String deviceId,
            String eventCode,
            String level,
            Boolean handled,
            Long startTime,
            Long endTime,
            int pageIndex,
            int pageSize
    ) {
        List<Object> args = new ArrayList<>();
        String whereClause = buildAlarmWhereClause(keyword, deviceId, eventCode, level, handled, startTime, endTime, args);
        long totalCount = count("SELECT COUNT(1) FROM alarm_snapshots" + whereClause, args);
        int safePageSize = Math.max(1, pageSize);
        int pageCount = Math.max(1, (int) Math.ceil(totalCount / (double) safePageSize));
        int safePageIndex = Math.max(1, Math.min(pageIndex, pageCount));
        int offset = (safePageIndex - 1) * safePageSize;

        List<Object> listArgs = new ArrayList<>(args);
        listArgs.add(safePageSize);
        listArgs.add(offset);

        List<JsonNode> items = jdbcTemplate.query(
                """
                SELECT raw_json
                FROM alarm_snapshots
                """ + whereClause + " ORDER BY alarm_time DESC, alarm_id DESC LIMIT ? OFFSET ?",
                (rs, rowNum) -> parseJson(rs.getString("raw_json")),
                listArgs.toArray()
        );

        return new PageData<>(safePageIndex, safePageSize, pageCount, totalCount, items);
    }

    public List<JsonNode> findLocations(String deviceId, Long startTime, Long endTime, int limit) {
        List<Object> args = new ArrayList<>();
        List<String> clauses = new ArrayList<>();
        String safeDeviceId = trimToNull(deviceId);
        if (safeDeviceId != null) {
            clauses.add("device_id = ?");
            args.add(safeDeviceId);
        }
        if (startTime != null) {
            clauses.add("recorded_at >= ?");
            args.add(startTime);
        }
        if (endTime != null) {
            clauses.add("recorded_at <= ?");
            args.add(endTime);
        }
        String whereClause = clauses.isEmpty() ? "" : " WHERE " + String.join(" AND ", clauses);
        args.add(Math.max(1, limit));
        return jdbcTemplate.query(
                "SELECT raw_json FROM location_points" + whereClause + " ORDER BY recorded_at ASC, id ASC LIMIT ?",
                (rs, rowNum) -> parseJson(rs.getString("raw_json")),
                args.toArray()
        );
    }

    private long count(String sql, List<Object> args) {
        Long total = jdbcTemplate.queryForObject(sql, Long.class, args.toArray());
        return total == null ? 0 : total;
    }

    private int countAsInt(String sql) {
        Long total = jdbcTemplate.queryForObject(sql, Long.class);
        return total == null ? 0 : total.intValue();
    }

    private String queryForString(String sql) {
        String value = jdbcTemplate.queryForObject(sql, String.class);
        return trimToNull(value);
    }

    private Long queryForLong(String sql) {
        return jdbcTemplate.queryForObject(sql, Long.class);
    }

    private String buildDeviceWhereClause(String keyword, String status, List<Object> args) {
        List<String> clauses = new ArrayList<>();
        String safeKeyword = trimToNull(keyword);
        if (safeKeyword != null) {
            String fuzzy = "%" + safeKeyword + "%";
            clauses.add("(device_id LIKE ? OR device_name LIKE ? OR group_name LIKE ? OR company_name LIKE ?)");
            args.add(fuzzy);
            args.add(fuzzy);
            args.add(fuzzy);
            args.add(fuzzy);
        }
        String safeStatus = trimToNull(status);
        if (safeStatus != null) {
            clauses.add("status = ?");
            args.add(safeStatus);
        }
        return clauses.isEmpty() ? "" : " WHERE " + String.join(" AND ", clauses);
    }

    private String buildAlarmWhereClause(
            String keyword,
            String deviceId,
            String eventCode,
            String level,
            Boolean handled,
            Long startTime,
            Long endTime,
            List<Object> args
    ) {
        List<String> clauses = new ArrayList<>();
        String safeKeyword = trimToNull(keyword);
        if (safeKeyword != null) {
            String fuzzy = "%" + safeKeyword + "%";
            clauses.add("(device_id LIKE ? OR device_name LIKE ? OR alarm_name LIKE ? OR event_code LIKE ?)");
            args.add(fuzzy);
            args.add(fuzzy);
            args.add(fuzzy);
            args.add(fuzzy);
        }
        String safeDeviceId = trimToNull(deviceId);
        if (safeDeviceId != null) {
            clauses.add("device_id = ?");
            args.add(safeDeviceId);
        }
        String safeEventCode = trimToNull(eventCode);
        if (safeEventCode != null) {
            clauses.add("event_code = ?");
            args.add(safeEventCode);
        }
        String safeLevel = trimToNull(level);
        if (safeLevel != null) {
            clauses.add("level = ?");
            args.add(safeLevel);
        }
        if (handled != null) {
            clauses.add("handled = ?");
            args.add(Boolean.TRUE.equals(handled) ? 1 : 0);
        }
        if (startTime != null) {
            clauses.add("alarm_time >= ?");
            args.add(startTime);
        }
        if (endTime != null) {
            clauses.add("alarm_time <= ?");
            args.add(endTime);
        }
        return clauses.isEmpty() ? "" : " WHERE " + String.join(" AND ", clauses);
    }

    private boolean isHandled(JsonNode alarm) {
        Long handleAt = longValue(alarm.get("handleAt"));
        if (handleAt != null && handleAt > 0) {
            return true;
        }
        String handleBy = trimToNull(textValue(alarm.get("handleBy")));
        return handleBy != null;
    }

    private Long longValue(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isNumber()) {
            return node.longValue();
        }
        if (node.isTextual()) {
            try {
                String text = trimToNull(node.asText());
                return text == null ? null : Long.parseLong(text);
            } catch (NumberFormatException ex) {
                return null;
            }
        }
        return null;
    }

    private String textValue(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        String text = node.asText();
        return text == null || text.isBlank() ? null : text;
    }

    private String stringify(JsonNode node) {
        try {
            return objectMapper.writeValueAsString(node);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("序列化平台快照失败", ex);
        }
    }

    private String stringifyNullable(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        return stringify(node);
    }

    private JsonNode parseJson(String rawJson) {
        try {
            return objectMapper.readTree(rawJson);
        } catch (IOException ex) {
            throw new IllegalStateException("解析本地快照数据失败", ex);
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String emptyToNull(String value) {
        return trimToNull(value);
    }

    private Long nullableLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value instanceof String text) {
            try {
                return Long.parseLong(text);
            } catch (NumberFormatException ex) {
                return null;
            }
        }
        return null;
    }
}
