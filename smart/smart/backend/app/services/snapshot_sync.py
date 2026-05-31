from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from ..models.models import AlarmSnapshot, DeviceSnapshot, LocationPoint
from ..upstream import UpstreamApiError, request_upstream


def _to_int_or_none(val: object) -> int | None:
    if val is None:
        return None
    try:
        return int(val)
    except (ValueError, TypeError):
        return None


def _to_str_or_none(val: object) -> str | None:
    if val is None:
        return None
    s = str(val).strip()
    return s if s else None


def sync_devices(token: str, db: Session) -> int:
    try:
        resp = request_upstream("GET", "/v1/user/devices", token=token)
        if not resp.ok or not isinstance(resp.json_data, dict):
            return 0
        data = resp.json_data.get("data", {})
        groups = data.get("groups", []) if isinstance(data, dict) else []
        if not isinstance(groups, list):
            return 0

        count = 0
        for group in groups:
            if not isinstance(group, dict):
                continue
            group_id = _to_int_or_none(group.get("id"))
            group_name = _to_str_or_none(group.get("groupName")) or "未分组"
            devices = group.get("devices", [])
            if not isinstance(devices, list):
                continue
            for device in devices:
                if not isinstance(device, dict):
                    continue
                device_id = _to_str_or_none(device.get("deviceId"))
                if not device_id:
                    continue

                existing = db.query(DeviceSnapshot).filter(DeviceSnapshot.device_id == device_id).first()
                if existing:
                    existing.group_id = group_id
                    existing.group_name = group_name
                    existing.device_index_id = _to_str_or_none(device.get("deviceIndexId"))
                    existing.device_name = _to_str_or_none(device.get("deviceName"))
                    existing.company_id = _to_int_or_none(device.get("companyId"))
                    existing.company_name = _to_str_or_none(device.get("companyName"))
                    existing.product_id = _to_int_or_none(device.get("productId"))
                    existing.product_code = _to_str_or_none(device.get("productCode"))
                    existing.product_name = _to_str_or_none(device.get("productName"))
                    existing.status = _to_str_or_none(device.get("status"))
                    existing.longitude = _to_str_or_none(device.get("longitude"))
                    existing.latitude = _to_str_or_none(device.get("latitude"))
                    existing.latest_data_json = device.get("latestData")
                    existing.protocols_json = device.get("protocol")
                    existing.raw_json = device
                    existing.source_updated_at = _to_str_or_none(device.get("updatedAt"))
                    existing.synced_at = datetime.now(timezone.utc)
                    existing.updated_at = datetime.now(timezone.utc)
                else:
                    db.add(DeviceSnapshot(
                        device_id=device_id,
                        group_id=group_id,
                        group_name=group_name,
                        device_index_id=_to_str_or_none(device.get("deviceIndexId")),
                        device_name=_to_str_or_none(device.get("deviceName")),
                        company_id=_to_int_or_none(device.get("companyId")),
                        company_name=_to_str_or_none(device.get("companyName")),
                        product_id=_to_int_or_none(device.get("productId")),
                        product_code=_to_str_or_none(device.get("productCode")),
                        product_name=_to_str_or_none(device.get("productName")),
                        status=_to_str_or_none(device.get("status")),
                        longitude=_to_str_or_none(device.get("longitude")),
                        latitude=_to_str_or_none(device.get("latitude")),
                        latest_data_json=device.get("latestData"),
                        protocols_json=device.get("protocol"),
                        raw_json=device,
                        source_updated_at=_to_str_or_none(device.get("updatedAt")),
                    ))
                count += 1
        db.commit()
        return count
    except UpstreamApiError:
        return 0


def sync_alarms(token: str, db: Session, start_time: int, end_time: int, page_size: int = 200) -> int:
    try:
        params = {
            "is_page": "true",
            "page_index": "1",
            "page_size": str(page_size),
            "start_time": str(start_time),
            "end_time": str(end_time),
        }
        resp = request_upstream("GET", "/v1/alarms", token=token, params=params)
        if not resp.ok or not isinstance(resp.json_data, dict):
            return 0
        data = resp.json_data.get("data", {})
        items = data.get("items", []) if isinstance(data, dict) else []
        if not isinstance(items, list):
            items = data if isinstance(data, list) else []

        count = 0
        for alarm in items:
            if not isinstance(alarm, dict):
                continue
            alarm_id = _to_int_or_none(alarm.get("id"))
            if alarm_id is None:
                continue

            handle_by = _to_str_or_none(alarm.get("handleBy"))
            handle_at = _to_str_or_none(alarm.get("handleAt"))
            handled = 1 if handle_by or handle_at else 0

            existing = db.query(AlarmSnapshot).filter(AlarmSnapshot.alarm_id == alarm_id).first()
            if existing:
                existing.company_id = _to_int_or_none(alarm.get("companyId"))
                existing.device_index_id = _to_str_or_none(alarm.get("deviceIndexId"))
                existing.device_id = _to_str_or_none(alarm.get("deviceId"))
                existing.device_name = _to_str_or_none(alarm.get("deviceName"))
                existing.alarm_name = _to_str_or_none(alarm.get("alarmName"))
                existing.alarm_time = _to_str_or_none(alarm.get("alarmTime"))
                existing.handle_by = handle_by
                existing.handle_at = handle_at
                existing.level = _to_str_or_none(alarm.get("level"))
                existing.status = _to_str_or_none(alarm.get("status"))
                existing.event_code = _to_str_or_none(alarm.get("eventCode"))
                existing.fence_id = _to_int_or_none(alarm.get("fenceId"))
                existing.handled = handled
                existing.raw_json = alarm
                existing.synced_at = datetime.now(timezone.utc)
                existing.updated_at = datetime.now(timezone.utc)
            else:
                db.add(AlarmSnapshot(
                    alarm_id=alarm_id,
                    company_id=_to_int_or_none(alarm.get("companyId")),
                    device_index_id=_to_str_or_none(alarm.get("deviceIndexId")),
                    device_id=_to_str_or_none(alarm.get("deviceId")),
                    device_name=_to_str_or_none(alarm.get("deviceName")),
                    alarm_name=_to_str_or_none(alarm.get("alarmName")),
                    alarm_time=_to_str_or_none(alarm.get("alarmTime")),
                    handle_by=handle_by,
                    handle_at=handle_at,
                    level=_to_str_or_none(alarm.get("level")),
                    status=_to_str_or_none(alarm.get("status")),
                    event_code=_to_str_or_none(alarm.get("eventCode")),
                    fence_id=_to_int_or_none(alarm.get("fenceId")),
                    handled=handled,
                    raw_json=alarm,
                    synced_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                ))
            count += 1
        db.commit()
        return count
    except UpstreamApiError:
        return 0


def sync_locations(token: str, db: Session, device_ids: list[str], start_time: int, end_time: int) -> int:
    count = 0
    for device_id in device_ids:
        did = _to_str_or_none(device_id)
        if not did:
            continue
        try:
            params = {
                "device_id": did,
                "start_time": str(start_time),
                "end_time": str(end_time),
            }
            resp = request_upstream("GET", "/v1/locations", token=token, params=params)
            if not resp.ok:
                continue
            data = resp.json_data
            if not isinstance(data, dict):
                continue
            items = data.get("data", [])
            if isinstance(items, dict):
                items = items.get("items", []) or items.get("list", []) or []
            if not isinstance(items, list):
                continue

            for point in items:
                if not isinstance(point, dict):
                    continue
                point_device_id = _to_str_or_none(point.get("deviceId")) or did
                recorded_at = _to_int_or_none(point.get("upTime")) or (_to_int_or_none(point.get("createTime")) or 0) * 1000
                if recorded_at <= 0:
                    continue

                longitude = _to_str_or_none(point.get("longitude"))
                latitude = _to_str_or_none(point.get("latitude"))
                if not longitude or not latitude:
                    continue

                exists = db.query(LocationPoint).filter(
                    LocationPoint.device_id == point_device_id,
                    LocationPoint.recorded_at == recorded_at
                ).first()
                if exists:
                    continue

                db.add(LocationPoint(
                    device_id=point_device_id,
                    longitude=longitude,
                    latitude=latitude,
                    recorded_at=recorded_at,
                    level=_to_int_or_none(point.get("level")),
                    event_code=_to_str_or_none(point.get("eventCode")),
                    nearby_electric_state=_to_str_or_none(point.get("nearbyElectricState")),
                    raw_json=point,
                ))
                count += 1
        except UpstreamApiError:
            continue
    db.commit()
    return count


def get_summary(db: Session) -> dict[str, Any]:
    total_devices = db.query(DeviceSnapshot).count()
    total_alarms = db.query(AlarmSnapshot).count()
    handled_alarms = db.query(AlarmSnapshot).filter(AlarmSnapshot.handled == 1).count()
    total_locations = db.query(LocationPoint).count()

    last_device_sync = db.query(DeviceSnapshot.synced_at).order_by(DeviceSnapshot.synced_at.desc()).first()
    last_alarm_sync = db.query(AlarmSnapshot.synced_at).order_by(AlarmSnapshot.synced_at.desc()).first()
    last_location_sync = db.query(LocationPoint.synced_at).order_by(LocationPoint.synced_at.desc()).first()

    last_sync = None
    for ts in [last_device_sync, last_alarm_sync, last_location_sync]:
        val = ts[0].isoformat() if ts and ts[0] else None
        if val and (last_sync is None or val > last_sync):
            last_sync = val

    return {
        "devices": {"total": total_devices, "lastSyncedAt": last_device_sync[0].isoformat() if last_device_sync and last_device_sync[0] else None},
        "alarms": {"total": total_alarms, "lastSyncedAt": last_alarm_sync[0].isoformat() if last_alarm_sync and last_alarm_sync[0] else None},
        "locations": {"total": total_locations, "lastSyncedAt": last_location_sync[0].isoformat() if last_location_sync and last_location_sync[0] else None},
        "handledAlarmCount": handled_alarms,
        "pendingAlarmCount": max(0, total_alarms - handled_alarms),
        "lastSyncedAt": last_sync,
    }
