from __future__ import annotations

from datetime import datetime
from typing import Any


STATUS_CN_MAP = {
    "online": "在线",
    "offline": "离线",
    "alarm": "报警",
    "pending": "待处置",
    "processing": "处理中",
    "disposed": "已处置",
    "handled": "已处置",
    "unhandled": "待处置",
}

ALARM_LEVEL_CN_MAP = {
    "high": "高",
    "medium": "中",
    "low": "低",
    "critical": "紧急",
}


def pick(source: dict[str, Any] | None, *keys: str, default: Any = None) -> Any:
    if not source:
        return default
    for key in keys:
        if key in source and source[key] is not None:
            return source[key]
    return default


def parse_bool(value: Any, default: bool = False) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "yes", "y", "on"}


def model_to_dict(value: Any) -> dict[str, Any]:
    if value is None:
        return {}
    if isinstance(value, dict):
        return value
    if hasattr(value, "model_dump"):
        return value.model_dump(exclude_none=True)
    if hasattr(value, "dict"):
        return value.dict(exclude_none=True)
    return dict(value)


def iso_to_str(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat(sep=" ", timespec="seconds")
    return str(value)


def to_millis(value: Any) -> int | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        number = int(value)
        return number if number > 10**11 else number * 1000
    text = str(value).strip()
    if not text:
        return None
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
        return int(parsed.timestamp() * 1000)
    except ValueError:
        return None


def normalize_status(status: Any, default: str = "未知") -> str:
    if status is None:
        return default
    text = str(status).strip()
    if not text:
        return default
    mapped = STATUS_CN_MAP.get(text.lower())
    return mapped or text


def normalize_alarm_level(level: Any) -> str:
    if level is None:
        return "中"
    text = str(level).strip()
    if not text:
        return "中"
    return ALARM_LEVEL_CN_MAP.get(text.lower(), text)


def normalize_user_payload(payload: dict[str, Any]) -> dict[str, Any]:
    role = pick(payload, "role", default={}) or {}
    return {
        "id": pick(payload, "id"),
        "createdAt": pick(payload, "createdAt", "created_at"),
        "created_at": pick(payload, "createdAt", "created_at"),
        "updatedAt": pick(payload, "updatedAt", "updated_at"),
        "updated_at": pick(payload, "updatedAt", "updated_at"),
        "username": pick(payload, "username"),
        "email": pick(payload, "email"),
        "phone": pick(payload, "phone"),
        "enable": pick(payload, "enable", default=True),
        "companyId": pick(payload, "companyId", "company_id"),
        "company_id": pick(payload, "companyId", "company_id"),
        "companyName": pick(payload, "companyName", "company_name"),
        "company_name": pick(payload, "companyName", "company_name"),
        "companyAdminUserName": pick(payload, "companyAdminUserName", "company_admin_username"),
        "company_admin_username": pick(payload, "companyAdminUserName", "company_admin_username"),
        "role": {
            "id": pick(role, "id"),
            "roleKey": pick(role, "roleKey", "role_key"),
            "role_key": pick(role, "roleKey", "role_key"),
            "roleName": pick(role, "roleName", "role_name"),
            "role_name": pick(role, "roleName", "role_name"),
            "remark": pick(role, "remark"),
        } if role else None,
    }


def normalize_device_payload(payload: dict[str, Any], *, local_extra: dict[str, Any] | None = None) -> dict[str, Any]:
    local_extra = local_extra or {}
    status = pick(payload, "status", default=pick(local_extra, "status", default="Offline"))
    online_time = pick(local_extra, "online_time", default="--")
    area = pick(local_extra, "area", default=pick(payload, "area", "groupName", "group_name", default="未分区"))
    battery = pick(local_extra, "battery", default=pick(payload, "battery", default=100))
    signal = pick(local_extra, "signal", default=pick(local_extra, "network_signal", default=100 if str(status).lower() == "online" else 0))
    normalized = {
        "id": pick(payload, "id"),
        "createdAt": pick(payload, "createdAt", "created_at"),
        "created_at": pick(payload, "createdAt", "created_at"),
        "updatedAt": pick(payload, "updatedAt", "updated_at"),
        "updated_at": pick(payload, "updatedAt", "updated_at"),
        "deviceId": pick(payload, "deviceId", "device_id"),
        "device_id": pick(payload, "deviceId", "device_id"),
        "deviceName": pick(payload, "deviceName", "device_name"),
        "device_name": pick(payload, "deviceName", "device_name"),
        "productId": pick(payload, "productId", "product_id"),
        "product_id": pick(payload, "productId", "product_id"),
        "productCode": pick(payload, "productCode", "product_code"),
        "product_code": pick(payload, "productCode", "product_code"),
        "productName": pick(payload, "productName", "product_name"),
        "product_name": pick(payload, "productName", "product_name"),
        "protocol": pick(payload, "protocol", default=[]),
        "longitude": pick(payload, "longitude"),
        "latitude": pick(payload, "latitude"),
        "latestData": pick(payload, "latestData", "latest_data"),
        "latest_data": pick(payload, "latestData", "latest_data"),
        "status": status,
        "statusText": normalize_status(status),
        "companyId": pick(payload, "companyId", "company_id"),
        "company_id": pick(payload, "companyId", "company_id"),
        "companyName": pick(payload, "companyName", "company_name"),
        "company_name": pick(payload, "companyName", "company_name"),
        "battery": battery,
        "signal": signal,
        "network_signal": signal,
        "area": area,
        "online_time": online_time,
        "bitrate": pick(local_extra, "bitrate", default=pick(payload, "bitrate", default="--")),
        "storage_status": pick(local_extra, "storage_status", default=pick(payload, "storage_status", default="Normal")),
    }
    return normalized


def normalize_alarm_payload(payload: dict[str, Any]) -> dict[str, Any]:
    raw_status = pick(payload, "status", default=pick(payload, "handled", default="pending"))
    handled = pick(payload, "handled")
    if handled is None:
        handled = str(raw_status).lower() in {"handled", "disposed", "done", "true", "1"}
    level = pick(payload, "level", "alarmLevel", "alarm_level")
    alarm_name = pick(payload, "alarmName", "alarm_name", "alarmType", "alarm_type")
    area = pick(payload, "area", "location", default="未知区域")
    alarm_time = pick(payload, "alarmTime", "alarm_time")
    handle_at = pick(payload, "handleAt", "handle_at", "disposedAt", "disposed_at")
    normalized = {
        "id": pick(payload, "id"),
        "companyId": pick(payload, "companyId", "company_id"),
        "company_id": pick(payload, "companyId", "company_id"),
        "deviceIndexId": pick(payload, "deviceIndexId", "device_index_id"),
        "device_index_id": pick(payload, "deviceIndexId", "device_index_id"),
        "deviceId": pick(payload, "deviceId", "device_id"),
        "device_id": pick(payload, "deviceId", "device_id"),
        "deviceName": pick(payload, "deviceName", "device_name"),
        "device_name": pick(payload, "deviceName", "device_name"),
        "remark": pick(payload, "remark", "description"),
        "alarmName": alarm_name,
        "alarm_name": alarm_name,
        "alarmTime": alarm_time,
        "alarm_time": alarm_time,
        "handleBy": pick(payload, "handleBy", "handle_by", "handler", "operator"),
        "handle_by": pick(payload, "handleBy", "handle_by", "handler", "operator"),
        "handleAt": handle_at,
        "handle_at": handle_at,
        "level": level,
        "alarmLevel": level,
        "alarm_level": level,
        "status": raw_status,
        "handled": handled,
        "alarmData": pick(payload, "alarmData", "alarm_data", default=""),
        "alarm_data": pick(payload, "alarmData", "alarm_data", default=""),
        "eventCode": pick(payload, "eventCode", "event_code", default=""),
        "event_code": pick(payload, "eventCode", "event_code", default=""),
        "fenceId": pick(payload, "fenceId", "fence_id"),
        "fence_id": pick(payload, "fenceId", "fence_id"),
        "area": area,
        "location": pick(payload, "location", default=area),
        "longitude": pick(payload, "longitude"),
        "latitude": pick(payload, "latitude"),
        "type": alarm_name or "未知",
        "time": iso_to_str(alarm_time) or iso_to_str(pick(payload, "triggeredAt", "triggered_at")) or "--",
        "handler": pick(payload, "handleBy", "handle_by", "handler", "operator", default="--"),
        "disposalTime": iso_to_str(handle_at) or iso_to_str(pick(payload, "disposedAt", "disposed_at")),
    }
    normalized["levelText"] = normalize_alarm_level(level)
    normalized["statusText"] = normalize_status(raw_status)
    return normalized


def normalize_fence_payload(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": pick(payload, "id"),
        "companyId": pick(payload, "companyId", "company_id"),
        "company_id": pick(payload, "companyId", "company_id"),
        "fenceName": pick(payload, "fenceName", "fence_name"),
        "fence_name": pick(payload, "fenceName", "fence_name"),
        "startTimeStr": pick(payload, "startTimeStr", "start_time_str"),
        "start_time_str": pick(payload, "startTimeStr", "start_time_str"),
        "endTimeStr": pick(payload, "endTimeStr", "end_time_str"),
        "end_time_str": pick(payload, "endTimeStr", "end_time_str"),
        "eventType": pick(payload, "eventType", "event_type"),
        "event_type": pick(payload, "eventType", "event_type"),
        "deviceIndexIds": pick(payload, "deviceIndexIds", "device_index_ids", default=[]),
        "device_index_ids": pick(payload, "deviceIndexIds", "device_index_ids", default=[]),
        "fenceShape": pick(payload, "fenceShape", "fence_shape"),
        "fence_shape": pick(payload, "fenceShape", "fence_shape"),
        "circleFenceData": pick(payload, "circleFenceData", "circle_fence_data"),
        "circle_fence_data": pick(payload, "circleFenceData", "circle_fence_data"),
        "polygonFenceData": pick(payload, "polygonFenceData", "polygon_fence_data"),
        "polygon_fence_data": pick(payload, "polygonFenceData", "polygon_fence_data"),
    }


def normalize_talk_group_payload(payload: dict[str, Any]) -> dict[str, Any]:
    devices = []
    for device in pick(payload, "devices", default=[]) or []:
        devices.append({
            "id": pick(device, "id"),
            "deviceId": pick(device, "deviceId", "device_id"),
            "device_id": pick(device, "deviceId", "device_id"),
            "deviceName": pick(device, "deviceName", "device_name"),
            "device_name": pick(device, "deviceName", "device_name"),
            "status": pick(device, "status"),
        })
    return {
        "id": pick(payload, "id"),
        "groupName": pick(payload, "groupName", "group_name"),
        "group_name": pick(payload, "groupName", "group_name"),
        "devices": devices,
    }
