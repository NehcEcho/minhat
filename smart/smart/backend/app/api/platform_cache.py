from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy.orm import Session

from ..auth import get_bearer_token
from ..database import get_db
from ..models.models import AlarmSnapshot, DeviceSnapshot, LocationPoint
from ..services import snapshot_sync

router = APIRouter()


@router.post("/api/platform-cache/sync")
def trigger_sync(
    body: dict = Body(default={}),
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db),
):
    now = int(time.time())
    start_time = body.get("startTime") or now - 7 * 24 * 3600
    end_time = body.get("endTime") or now

    synced_devices = snapshot_sync.sync_devices(token, db)
    synced_alarms = snapshot_sync.sync_alarms(token, db, start_time, end_time)
    device_ids = [r[0] for r in db.query(DeviceSnapshot.device_id).all()]
    synced_locations = snapshot_sync.sync_locations(token, db, device_ids, start_time, end_time)

    return {
        "code": 0,
        "msg": "同步完成",
        "data": {
            "totalDevices": db.query(DeviceSnapshot).count(),
            "totalAlarms": db.query(AlarmSnapshot).count(),
            "totalLocations": db.query(LocationPoint).count(),
            "syncedDeviceCount": synced_devices,
            "syncedAlarmCount": synced_alarms,
            "syncedLocationCount": synced_locations,
        },
    }


@router.get("/api/platform-cache/summary")
def get_summary(
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db),
):
    return {"code": 0, "msg": "ok", "data": snapshot_sync.get_summary(db)}


@router.get("/api/platform-cache/user/devices")
def get_cached_user_devices(
    keyword: str | None = Query(None),
    status: str | None = Query(None),
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db),
):
    query = db.query(DeviceSnapshot)
    if keyword:
        kw = f"%{keyword}%"
        query = query.filter(
            DeviceSnapshot.device_name.like(kw)
            | DeviceSnapshot.device_id.like(kw)
            | DeviceSnapshot.group_name.like(kw)
        )
    if status:
        query = query.filter(DeviceSnapshot.status == status)

    devices = query.all()
    groups: dict[str, dict[str, Any]] = {}
    for d in devices:
        key = f"{d.group_id or 'null'}::{d.group_name or '未分组'}"
        if key not in groups:
            groups[key] = {
                "id": d.group_id,
                "groupName": d.group_name or "未分组",
                "devices": [],
            }
        groups[key]["devices"].append(d.raw_json or {
            "deviceId": d.device_id,
            "deviceName": d.device_name,
            "status": d.status,
        })

    return {"code": 0, "msg": "ok", "data": {"groups": list(groups.values())}}


@router.get("/api/platform-cache/devices")
def get_cached_devices(
    keyword: str | None = Query(None),
    status: str | None = Query(None),
    page_index: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db),
):
    query = db.query(DeviceSnapshot)
    if keyword:
        kw = f"%{keyword}%"
        query = query.filter(
            DeviceSnapshot.device_name.like(kw)
            | DeviceSnapshot.device_id.like(kw)
        )
    if status:
        query = query.filter(DeviceSnapshot.status == status)

    total = query.count()
    items = query.offset((page_index - 1) * page_size).limit(page_size).all()

    return {
        "code": 0, "msg": "ok",
        "data": {
            "pageIndex": page_index,
            "pageSize": page_size,
            "pageCount": (total + page_size - 1) // page_size if page_size else 1,
            "total": total,
            "items": [
                {
                    "deviceId": d.device_id,
                    "deviceName": d.device_name,
                    "groupName": d.group_name,
                    "status": d.status,
                    "longitude": d.longitude,
                    "latitude": d.latitude,
                    "companyName": d.company_name,
                }
                for d in items
            ],
        },
    }


@router.get("/api/platform-cache/alarms")
def get_cached_alarms(
    keyword: str | None = Query(None),
    device_id: str | None = Query(None),
    event_code: str | None = Query(None),
    level: str | None = Query(None),
    handled: bool | None = Query(None),
    start_time: int | None = Query(None),
    end_time: int | None = Query(None),
    page_index: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db),
):
    query = db.query(AlarmSnapshot)
    if keyword:
        kw = f"%{keyword}%"
        query = query.filter(
            AlarmSnapshot.alarm_name.like(kw)
            | AlarmSnapshot.device_name.like(kw)
            | AlarmSnapshot.device_id.like(kw)
        )
    if device_id:
        query = query.filter(AlarmSnapshot.device_id == device_id)
    if event_code:
        query = query.filter(AlarmSnapshot.event_code == event_code)
    if level:
        query = query.filter(AlarmSnapshot.level == level)
    if handled is not None:
        query = query.filter(AlarmSnapshot.handled == (1 if handled else 0))

    total = query.count()
    items = query.order_by(AlarmSnapshot.alarm_time.desc()).offset(
        (page_index - 1) * page_size
    ).limit(page_size).all()

    return {
        "code": 0, "msg": "ok",
        "data": {
            "pageIndex": page_index,
            "pageSize": page_size,
            "pageCount": (total + page_size - 1) // page_size if page_size else 1,
            "total": total,
            "items": [
                {
                    "alarmId": a.alarm_id,
                    "alarmName": a.alarm_name,
                    "deviceId": a.device_id,
                    "deviceName": a.device_name,
                    "level": a.level,
                    "eventCode": a.event_code,
                    "handled": a.handled,
                    "status": a.status,
                    "handleBy": a.handle_by,
                }
                for a in items
            ],
        },
    }


@router.get("/api/platform-cache/locations")
def get_cached_locations(
    device_id: str = Query(...),
    start_time: int | None = Query(None),
    end_time: int | None = Query(None),
    limit: int = Query(500, ge=1, le=5000),
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db),
):
    query = db.query(LocationPoint).filter(LocationPoint.device_id == device_id)
    start_ms = start_time * 1000 if start_time is not None and start_time < 1e12 else start_time
    end_ms = end_time * 1000 if end_time is not None and end_time < 1e12 else end_time
    if start_ms is not None:
        query = query.filter(LocationPoint.recorded_at >= start_ms)
    if end_ms is not None:
        query = query.filter(LocationPoint.recorded_at <= end_ms)

    items = query.order_by(LocationPoint.recorded_at.asc()).limit(limit).all()

    return {
        "code": 0, "msg": "ok",
        "data": [
            {
                "deviceId": p.device_id,
                "longitude": p.longitude,
                "latitude": p.latitude,
                "recordedAt": p.recorded_at,
                "level": p.level,
                "eventCode": p.event_code,
            }
            for p in items
        ],
    }
