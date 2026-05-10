package com.smarthelmet.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.smarthelmet.backend.exception.RemoteApiException;
import com.smarthelmet.backend.model.CompanyApiResult;
import com.smarthelmet.backend.model.GroupedDeviceSnapshot;
import com.smarthelmet.backend.model.PageData;
import com.smarthelmet.backend.model.PlatformSnapshotDomainSummary;
import com.smarthelmet.backend.model.PlatformSnapshotSyncRequest;
import com.smarthelmet.backend.model.PlatformSnapshotSyncResult;
import com.smarthelmet.backend.model.PlatformSnapshotSummary;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

@Service
public class PlatformSnapshotService {

    private final HelmetApiGateway helmetApiGateway;
    private final PlatformSnapshotRepository repository;
    private final ObjectMapper objectMapper;

    public PlatformSnapshotService(
            HelmetApiGateway helmetApiGateway,
            PlatformSnapshotRepository repository,
            ObjectMapper objectMapper
    ) {
        this.helmetApiGateway = helmetApiGateway;
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public PlatformSnapshotSyncResult sync(String token, PlatformSnapshotSyncRequest request) {
        boolean syncDevices = request == null || request.syncDevices() == null || request.syncDevices();
        boolean syncAlarms = request == null || request.syncAlarms() == null || request.syncAlarms();
        boolean syncLocations = request == null || request.syncLocations() == null || request.syncLocations();

        long now = Instant.now().toEpochMilli();
        long alarmEndTime = defaultOr(request == null ? null : request.endTime(), now / 1000);
        long alarmStartTime = defaultOr(request == null ? null : request.startTime(), alarmEndTime - 7 * 24 * 60 * 60L);
        long locationEndTime = alarmEndTime;
        long locationStartTime = defaultOr(request == null ? null : request.startTime(), locationEndTime - 24 * 60 * 60L);

        int syncedDeviceCount = 0;
        int syncedAlarmCount = 0;
        int syncedLocationCount = 0;

        if (syncDevices) {
            syncedDeviceCount = syncDevices(token);
        }

        if (syncAlarms) {
            int alarmPageSize = Math.max(1, request == null || request.alarmPageSize() == null ? 200 : request.alarmPageSize());
            syncedAlarmCount = syncAlarms(token, alarmStartTime, alarmEndTime, alarmPageSize);
        }

        if (syncLocations) {
            List<String> targetDeviceIds = resolveLocationDeviceIds(request == null ? null : request.deviceId(), syncDevices, token);
            syncedLocationCount = syncLocations(token, targetDeviceIds, locationStartTime, locationEndTime);
        }

        return new PlatformSnapshotSyncResult(
                repository.countDevices(),
                repository.countAlarms(),
                repository.countLocations(),
                syncedDeviceCount,
                syncedAlarmCount,
                syncedLocationCount,
                locationStartTime,
                locationEndTime,
                Instant.now().toString()
        );
    }

    public JsonNode getGroupedDevices(String keyword, String status) {
        List<GroupedDeviceSnapshot> rows = repository.findGroupedDevices(keyword, status);
        Map<String, ObjectNode> groups = new LinkedHashMap<>();
        ArrayNode groupItems = objectMapper.createArrayNode();

        for (GroupedDeviceSnapshot row : rows) {
            String groupName = safeGroupName(row.groupName());
            Long groupId = row.groupId();
            String key = (groupId == null ? "null" : String.valueOf(groupId)) + "::" + groupName;
            ObjectNode groupNode = groups.get(key);
            if (groupNode == null) {
                groupNode = objectMapper.createObjectNode();
                if (groupId != null) {
                    groupNode.put("id", groupId);
                } else {
                    groupNode.putNull("id");
                }
                groupNode.put("groupName", groupName);
                groupNode.set("devices", objectMapper.createArrayNode());
                groups.put(key, groupNode);
                groupItems.add(groupNode);
            }
            ((ArrayNode) groupNode.get("devices")).add(row.device());
        }

        ObjectNode payload = objectMapper.createObjectNode();
        payload.set("groups", groupItems);
        return payload;
    }

    public PageData<JsonNode> getDevicePage(String keyword, String status, int pageIndex, int pageSize) {
        return repository.findDevicePage(keyword, status, pageIndex, pageSize);
    }

    public PageData<JsonNode> getAlarmPage(
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
        return repository.findAlarmPage(keyword, deviceId, eventCode, level, handled, startTime, endTime, pageIndex, pageSize);
    }

    public List<JsonNode> getLocations(String deviceId, Long startTime, Long endTime, int limit) {
        return repository.findLocations(deviceId, startTime, endTime, limit);
    }

    public PlatformSnapshotSummary getSummary() {
        int totalAlarms = repository.countAlarms();
        int handledAlarmCount = repository.countHandledAlarms();

        PlatformSnapshotDomainSummary devices = new PlatformSnapshotDomainSummary(
                repository.countDevices(),
                repository.findLastDeviceSyncedAt(),
                repository.findLatestDeviceSourceUpdatedAt()
        );
        PlatformSnapshotDomainSummary alarms = new PlatformSnapshotDomainSummary(
                totalAlarms,
                repository.findLastAlarmSyncedAt(),
                formatEpochSeconds(repository.findLatestAlarmTime())
        );
        PlatformSnapshotDomainSummary locations = new PlatformSnapshotDomainSummary(
                repository.countLocations(),
                repository.findLastLocationSyncedAt(),
                formatEpochMillis(repository.findLatestLocationRecordedAt())
        );

        return new PlatformSnapshotSummary(
                devices,
                alarms,
                locations,
                handledAlarmCount,
                Math.max(0, totalAlarms - handledAlarmCount),
                latestNonBlank(
                        devices.lastSyncedAt(),
                        alarms.lastSyncedAt(),
                        locations.lastSyncedAt()
                )
        );
    }

    private List<String> resolveLocationDeviceIds(String deviceId, boolean alreadySyncedDevices, String token) {
        String safeDeviceId = trimToNull(deviceId);
        if (safeDeviceId != null) {
            return List.of(safeDeviceId);
        }
        List<String> deviceIds = repository.findAllDeviceIds();
        if (!deviceIds.isEmpty()) {
            return deviceIds;
        }
        if (!alreadySyncedDevices) {
            syncDevices(token);
            deviceIds = repository.findAllDeviceIds();
        }
        return deviceIds;
    }

    private int syncDevices(String token) {
        CompanyApiResult result = helmetApiGateway.get("/v1/user/devices", token, null);
        JsonNode groupsNode = extractGroupArray(result, "同步设备快照失败");
        int count = 0;
        for (JsonNode group : groupsNode) {
            Long groupId = longValue(group.get("id"));
            String groupName = textValue(group.get("groupName"));
            JsonNode devices = group.get("devices");
            if (devices == null || !devices.isArray()) {
                continue;
            }
            for (JsonNode device : devices) {
                if (trimToNull(textValue(device.get("deviceId"))) == null) {
                    continue;
                }
                repository.upsertDevice(groupId, groupName, device);
                count += 1;
            }
        }
        return count;
    }

    private int syncAlarms(String token, long startTime, long endTime, int pageSize) {
        MultiValueMap<String, String> query = new LinkedMultiValueMap<>();
        query.add("is_page", "true");
        query.add("page_index", "1");
        query.add("page_size", String.valueOf(pageSize));
        query.add("start_time", String.valueOf(startTime));
        query.add("end_time", String.valueOf(endTime));
        CompanyApiResult result = helmetApiGateway.get("/v1/alarms", token, query);
        JsonNode items = extractItemsArray(result, "同步告警快照失败");
        int count = 0;
        for (JsonNode alarm : items) {
            if (longValue(alarm.get("id")) == null) {
                continue;
            }
            repository.upsertAlarm(alarm);
            count += 1;
        }
        return count;
    }

    private int syncLocations(String token, List<String> deviceIds, long startTime, long endTime) {
        int count = 0;
        for (String deviceId : deviceIds) {
            if (trimToNull(deviceId) == null) {
                continue;
            }
            MultiValueMap<String, String> query = new LinkedMultiValueMap<>();
            query.add("device_id", deviceId);
            query.add("start_time", String.valueOf(startTime));
            query.add("end_time", String.valueOf(endTime));
            CompanyApiResult result = helmetApiGateway.get("/v1/locations", token, query);
            JsonNode items = extractDataNode(result, "同步轨迹快照失败");
            if (!items.isArray()) {
                continue;
            }
            for (JsonNode point : items) {
                String pointDeviceId = trimToNull(textValue(point.get("deviceId")));
                long recordedAt = normalizePointTimestamp(point);
                String targetDeviceId = pointDeviceId == null ? deviceId : pointDeviceId;
                if (trimToNull(targetDeviceId) == null || recordedAt <= 0) {
                    continue;
                }
                repository.upsertLocation(targetDeviceId, recordedAt, point);
                count += 1;
            }
        }
        return count;
    }

    private JsonNode extractGroupArray(CompanyApiResult result, String action) {
        JsonNode data = extractDataNode(result, action);
        JsonNode groups = data.get("groups");
        if (groups != null && groups.isArray()) {
            return groups;
        }
        return objectMapper.createArrayNode();
    }

    private JsonNode extractItemsArray(CompanyApiResult result, String action) {
        JsonNode data = extractDataNode(result, action);
        if (data.isArray()) {
            return data;
        }
        for (String field : List.of("items", "list", "rows", "records")) {
            JsonNode value = data.get(field);
            if (value != null && value.isArray()) {
                return value;
            }
        }
        return objectMapper.createArrayNode();
    }

    private JsonNode extractDataNode(CompanyApiResult result, String action) {
        if (!result.isSuccessStatus()) {
            throw new RemoteApiException(action + "：" + extractResultMessage(result));
        }
        JsonNode jsonBody = result.jsonBody();
        if (jsonBody == null || jsonBody == NullNode.getInstance() || jsonBody.isNull()) {
            throw new RemoteApiException(action + "：上游返回为空");
        }
        JsonNode data = jsonBody.get("data");
        return data == null || data.isNull() ? jsonBody : data;
    }

    private String extractResultMessage(CompanyApiResult result) {
        JsonNode body = result.jsonBody();
        if (body != null && !body.isNull()) {
            for (String field : List.of("msg", "message", "error")) {
                JsonNode node = body.get(field);
                if (node != null && !node.isNull() && !node.asText().isBlank()) {
                    return node.asText();
                }
            }
        }
        String rawBody = result.rawBody();
        if (rawBody != null && !rawBody.isBlank()) {
            return rawBody;
        }
        return "上游接口调用失败(" + result.statusCode() + ")";
    }

    private long normalizePointTimestamp(JsonNode point) {
        Long upTime = longValue(point.get("upTime"));
        if (upTime != null && upTime > 0) {
            return upTime;
        }
        Long createTime = longValue(point.get("createTime"));
        if (createTime != null && createTime > 0) {
            return createTime * 1000;
        }
        return 0;
    }

    private long defaultOr(Long value, long fallback) {
        return value == null || value <= 0 ? fallback : value;
    }

    private Long longValue(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isNumber()) {
            return node.longValue();
        }
        if (node.isTextual()) {
            String text = trimToNull(node.asText());
            if (text == null) {
                return null;
            }
            try {
                return Long.parseLong(text);
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

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String safeGroupName(String value) {
        String groupName = trimToNull(value);
        return groupName == null ? "未分组" : groupName;
    }

    private String formatEpochSeconds(Long value) {
        if (value == null || value <= 0) {
            return null;
        }
        return Instant.ofEpochSecond(value).toString();
    }

    private String formatEpochMillis(Long value) {
        if (value == null || value <= 0) {
            return null;
        }
        return Instant.ofEpochMilli(value).toString();
    }

    private String latestNonBlank(String... values) {
        String latest = null;
        for (String value : values) {
            String safeValue = trimToNull(value);
            if (safeValue == null) {
                continue;
            }
            if (latest == null || safeValue.compareTo(latest) > 0) {
                latest = safeValue;
            }
        }
        return latest;
    }
}
