from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import get_bearer_token, get_current_user
from ..compat import model_to_dict, normalize_alarm_payload, pick
from ..database import get_db
from ..models.models import Alarm
from ..schemas.schemas import AlarmUpdate
from ..upstream import UpstreamApiError, request_upstream

router = APIRouter()


def _local_alarm(alarm: Alarm) -> dict:
    return {
        "id": alarm.id,
        "company_id": 1,
        "device_index_id": None,
        "device_id": alarm.device_id,
        "device_name": alarm.device_name,
        "remark": alarm.description,
        "alarm_name": alarm.alarm_type,
        "alarm_time": int(alarm.triggered_at.timestamp() * 1000) if alarm.triggered_at else None,
        "handle_by": alarm.operator,
        "handle_at": int(alarm.disposed_at.timestamp() * 1000) if alarm.disposed_at else None,
        "level": alarm.alarm_level,
        "status": alarm.status,
        "alarm_data": alarm.description or "",
        "event_code": str(alarm.event_type or ""),
        "fence_id": None,
        "area": alarm.area,
        "location": alarm.location,
        "longitude": alarm.longitude,
        "latitude": alarm.latitude,
    }


def _paginate_payload(items: list[dict], page_index: int, page_size: int, total: int) -> dict:
    page_count = (total + page_size - 1) // page_size if page_size else 1
    return {
        "pageIndex": page_index,
        "page_index": page_index,
        "pageSize": page_size,
        "page_size": page_size,
        "pageCount": page_count,
        "page_count": page_count,
        "total": total,
        "items": items,
    }


@router.get("/v1/alarms")
def get_alarm_list(
    is_page: bool = Query(True),
    page_index: int = Query(1),
    page_size: int = Query(20),
    page: int | None = Query(None),
    device_id: str | None = Query(None),
    device_name: str | None = Query(None),
    company_id: int | None = Query(None),
    event_code: str | None = Query(None),
    level: str | None = Query(None),
    alarm_level: str | None = Query(None),
    start_time: int | None = Query(None),
    end_time: int | None = Query(None),
    handled: bool | None = Query(None),
    status: str | None = Query(None),
    alarm_type: str | None = Query(None),
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db)
):
    effective_page = page or page_index
    try:
        params = {
            "is_page": str(is_page).lower(),
            "page_index": effective_page,
            "page_size": page_size,
            "device_id": device_id,
            "device_name": device_name,
            "company_id": company_id,
            "event_code": event_code,
            "level": level or alarm_level,
            "start_time": start_time,
            "end_time": end_time,
            "handled": handled,
        }
        response = request_upstream("GET", "/v1/alarms", token=token, params=params)
        if response.ok and isinstance(response.json_data, dict):
            payload = response.json_data.get("data") if isinstance(response.json_data.get("data"), dict) else {}
            items = [normalize_alarm_payload(item) for item in payload.get("items", []) or []]
            return {
                "code": response.json_data.get("code", 0),
                "msg": response.json_data.get("msg", "ok"),
                "data": _paginate_payload(
                    items,
                    int(pick(payload, "pageIndex", "page_index", default=effective_page) or effective_page),
                    int(pick(payload, "pageSize", "page_size", default=page_size) or page_size),
                    int(pick(payload, "total", default=len(items)) or len(items)),
                ),
            }
    except UpstreamApiError:
        pass
    query = db.query(Alarm)
    if alarm_level or level:
        query = query.filter(Alarm.alarm_level == (alarm_level or level))
    if status and status != "all":
        query = query.filter(Alarm.status == status)
    if alarm_type:
        query = query.filter(Alarm.alarm_type == alarm_type)
    if device_id:
        query = query.filter(Alarm.device_id.like(f"%{device_id}%"))
    if device_name:
        query = query.filter(Alarm.device_name.like(f"%{device_name}%"))
    total = query.count()
    items = query.offset((effective_page - 1) * page_size).limit(page_size).all() if is_page else query.all()
    normalized = [normalize_alarm_payload(_local_alarm(alarm)) for alarm in items]
    return {"code": 0, "msg": "ok", "data": _paginate_payload(normalized, effective_page, page_size, total)}


@router.get("/v1/alarms/{id}")
def get_alarm(
    id: int,
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db)
):
    try:
        response = request_upstream("GET", f"/v1/alarms/{id}", token=token)
        if response.ok and isinstance(response.json_data, dict):
            payload = response.json_data.get("data") if isinstance(response.json_data.get("data"), dict) else {}
            return {"code": response.json_data.get("code", 0), "msg": response.json_data.get("msg", "ok"), "data": normalize_alarm_payload(payload)}
    except UpstreamApiError:
        pass
    alarm = db.query(Alarm).filter(Alarm.id == id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    return {"code": 0, "msg": "ok", "data": normalize_alarm_payload(_local_alarm(alarm))}


@router.put("/v1/alarms/{id}")
def update_alarm(
    id: int,
    body: AlarmUpdate = Body(...),
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db)
):
    body_data = model_to_dict(body)
    upstream_body = {}
    if pick(body_data, "remark", "description") is not None:
        upstream_body["remark"] = pick(body_data, "remark", "description")
    if pick(body_data, "level", "alarm_level") is not None:
        upstream_body["level"] = pick(body_data, "level", "alarm_level")
    if pick(body_data, "handled", "status") is not None:
        raw_value = pick(body_data, "handled", "status")
        if isinstance(raw_value, str) and raw_value.lower() in {"已处置", "handled", "disposed", "true", "1"}:
            upstream_body["handled"] = True
        elif isinstance(raw_value, str) and raw_value.lower() in {"待处置", "处理中", "pending", "processing", "false", "0"}:
            upstream_body["handled"] = False
        elif isinstance(raw_value, bool):
            upstream_body["handled"] = raw_value
        else:
            upstream_body["handled"] = True
    try:
        response = request_upstream("PUT", f"/v1/alarms/{id}", token=token, json_body=upstream_body)
        if response.ok and isinstance(response.json_data, dict):
            return response.json_data
    except UpstreamApiError:
        pass
    alarm = db.query(Alarm).filter(Alarm.id == id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    if pick(body_data, "status") is not None:
        alarm.status = pick(body_data, "status")
    if pick(body_data, "operator") is not None:
        alarm.operator = pick(body_data, "operator")
    if pick(body_data, "description") is not None:
        alarm.description = pick(body_data, "description")
    db.commit()
    return {"code": 0, "msg": "alarm updated"}


@router.post("/v1/alarms/{id}/dispose")
def dispose_alarm(
    id: int,
    body: dict = Body(default={}),
    user: dict = Depends(get_current_user),
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db)
):
    try:
        upstream_body = {"handled": "true", "remark": body.get("description") or "已处置"}
        response = request_upstream("PUT", f"/v1/alarms/{id}", token=token, json_body=upstream_body)
        if response.ok and isinstance(response.json_data, dict):
            return {"code": 0, "msg": "alarm disposed", "data": response.json_data.get("data")}
    except UpstreamApiError:
        pass

    alarm = db.query(Alarm).filter(Alarm.id == id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    alarm.status = "disposed"
    alarm.operator = body.get("operator") or user.get("username") or "operator"
    alarm.disposed_at = datetime.utcnow()
    if body.get("description"):
        alarm.description = body["description"]
    db.commit()
    return {"code": 0, "msg": "alarm disposed", "data": normalize_alarm_payload(_local_alarm(alarm))}
