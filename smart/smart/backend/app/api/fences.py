from __future__ import annotations

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import get_bearer_token, get_current_user
from ..compat import model_to_dict, normalize_fence_payload, pick
from ..database import get_db
from ..models.models import Fence
from ..services.validation import ValidationError, validate_fence_payload
from ..upstream import UpstreamApiError, request_upstream

router = APIRouter()


FENCE_EVENT_TYPE_MAP = {
    "禁入": 11,
    "超时": 12,
    "预警": 13,
    "授权": 14,
    "超员": 15,
    "越界": 16,
    "超速": 17,
    "安全": 18,
}


def _local_fence(fence: Fence) -> dict:
    return {
        "id": fence.id,
        "company_id": fence.company_id,
        "fence_name": fence.fence_name,
        "start_time_str": fence.start_time_str,
        "end_time_str": fence.end_time_str,
        "event_type": fence.event_type,
        "device_index_ids": fence.device_index_ids or [],
        "fence_shape": fence.fence_shape,
        "circle_fence_data": fence.circle_fence_data,
        "polygon_fence_data": fence.polygon_fence_data,
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


def _coerce_event_type(value: object) -> int | None:
    if value is None:
        return None
    if isinstance(value, int):
        return value
    text = str(value).strip()
    if not text:
        return None
    if text.isdigit():
        return int(text)
    return FENCE_EVENT_TYPE_MAP.get(text)


def _extract_fence_body(body_data: dict, *, partial: bool) -> dict:
    payload: dict = {}

    fence_name = pick(body_data, "fenceName", "fence_name")
    if fence_name is not None:
        payload["fence_name"] = fence_name

    start_time = pick(body_data, "startTimeStr", "start_time_str", "startTime", "start_time")
    if start_time is not None:
        payload["start_time_str"] = str(start_time)
    elif not partial:
        payload["start_time_str"] = "00:00:00"

    end_time = pick(body_data, "endTimeStr", "end_time_str", "endTime", "end_time")
    if end_time is not None:
        payload["end_time_str"] = str(end_time)
    elif not partial:
        payload["end_time_str"] = "23:59:59"

    event_type = _coerce_event_type(pick(body_data, "eventType", "event_type"))
    if event_type is not None:
        payload["event_type"] = event_type
    elif not partial:
        payload["event_type"] = 11

    device_index_ids = pick(body_data, "deviceIndexIds", "device_index_ids")
    if device_index_ids is not None:
        payload["device_index_ids"] = device_index_ids
    elif not partial:
        payload["device_index_ids"] = []

    fence_shape = pick(body_data, "fenceShape", "fence_shape")
    if fence_shape is not None:
        payload["fence_shape"] = fence_shape
    elif not partial:
        payload["fence_shape"] = "Circle"

    circle_fence_data = pick(body_data, "circleFenceData", "circle_fence_data")
    if circle_fence_data is not None:
        payload["circle_fence_data"] = circle_fence_data

    polygon_fence_data = pick(body_data, "polygonFenceData", "polygon_fence_data")
    if polygon_fence_data is not None:
        payload["polygon_fence_data"] = polygon_fence_data

    if not partial and "circle_fence_data" not in payload and "polygon_fence_data" not in payload:
        payload["circle_fence_data"] = {"longitude": 0, "latitude": 0, "radius": 100}

    return payload


@router.post("/v1/fences")
def create_fence(
    body: dict = Body(...),
    user: dict = Depends(get_current_user),
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db)
):
    body_data = model_to_dict(body)
    canonical = _extract_fence_body(body_data, partial=False)
    upstream_body = {
        "fenceName": canonical.get("fence_name"),
        "startTimeStr": canonical.get("start_time_str"),
        "endTimeStr": canonical.get("end_time_str"),
        "eventType": canonical.get("event_type"),
        "deviceIndexIds": canonical.get("device_index_ids", []),
        "fenceShape": canonical.get("fence_shape"),
        "circleFenceData": canonical.get("circle_fence_data"),
        "polygonFenceData": canonical.get("polygon_fence_data"),
    }
    try:
        validate_fence_payload(upstream_body, create_mode=True)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    try:
        response = request_upstream("POST", "/v1/fences", token=token, json_body=upstream_body)
        if response.ok and isinstance(response.json_data, dict):
            return response.json_data
    except UpstreamApiError:
        pass
    fence = Fence(
        fence_name=canonical.get("fence_name") or "未命名围栏",
        start_time_str=canonical.get("start_time_str"),
        end_time_str=canonical.get("end_time_str"),
        event_type=canonical.get("event_type"),
        company_id=user.get("company_id") or 1,
        device_index_ids=canonical.get("device_index_ids", []),
        fence_shape=canonical.get("fence_shape"),
        circle_fence_data=canonical.get("circle_fence_data"),
        polygon_fence_data=canonical.get("polygon_fence_data"),
    )
    db.add(fence)
    db.commit()
    db.refresh(fence)
    return {"code": 0, "msg": "fence created", "data": fence.id}


@router.put("/v1/fences/{id}")
def update_fence(
    id: int,
    body: dict = Body(...),
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db)
):
    body_data = model_to_dict(body)
    canonical = _extract_fence_body(body_data, partial=True)
    upstream_body = {}
    if "fence_name" in canonical:
        upstream_body["fenceName"] = canonical["fence_name"]
    if "start_time_str" in canonical:
        upstream_body["startTimeStr"] = canonical["start_time_str"]
    if "end_time_str" in canonical:
        upstream_body["endTimeStr"] = canonical["end_time_str"]
    if "event_type" in canonical:
        upstream_body["eventType"] = canonical["event_type"]
    if pick(body_data, "updateFenceDevice", "update_fence_device") is not None:
        upstream_body["updateFenceDevice"] = pick(body_data, "updateFenceDevice", "update_fence_device")
    if "device_index_ids" in canonical:
        upstream_body["deviceIndexIds"] = canonical["device_index_ids"]
    if "fence_shape" in canonical:
        upstream_body["fenceShape"] = canonical["fence_shape"]
    if "circle_fence_data" in canonical:
        upstream_body["circleFenceData"] = canonical["circle_fence_data"]
    if "polygon_fence_data" in canonical:
        upstream_body["polygonFenceData"] = canonical["polygon_fence_data"]
    try:
        response = request_upstream("PUT", f"/v1/fences/{id}", token=token, json_body=upstream_body)
        if response.ok and isinstance(response.json_data, dict):
            return response.json_data
    except UpstreamApiError:
        pass
    fence = db.query(Fence).filter(Fence.id == id).first()
    if not fence:
        raise HTTPException(status_code=404, detail="Fence not found")
    if "fence_name" in canonical:
        fence.fence_name = canonical["fence_name"]
    if "start_time_str" in canonical:
        fence.start_time_str = canonical["start_time_str"]
    if "end_time_str" in canonical:
        fence.end_time_str = canonical["end_time_str"]
    if "event_type" in canonical:
        fence.event_type = canonical["event_type"]
    if "device_index_ids" in canonical:
        fence.device_index_ids = canonical["device_index_ids"]
    if "fence_shape" in canonical:
        fence.fence_shape = canonical["fence_shape"]
    if "circle_fence_data" in canonical:
        fence.circle_fence_data = canonical["circle_fence_data"]
    if "polygon_fence_data" in canonical:
        fence.polygon_fence_data = canonical["polygon_fence_data"]
    db.commit()
    return {"code": 0, "msg": "fence updated"}


@router.delete("/v1/fences/{id}")
def delete_fence(
    id: int,
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db)
):
    try:
        response = request_upstream("DELETE", f"/v1/fences/{id}", token=token)
        if response.ok and isinstance(response.json_data, dict):
            return response.json_data
    except UpstreamApiError:
        pass
    fence = db.query(Fence).filter(Fence.id == id).first()
    if not fence:
        raise HTTPException(status_code=404, detail="Fence not found")
    db.delete(fence)
    db.commit()
    return {"code": 0, "msg": "fence deleted"}


@router.get("/v1/fences/{id}")
def get_fence(
    id: int,
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db)
):
    try:
        response = request_upstream("GET", f"/v1/fences/{id}", token=token)
        if response.ok and isinstance(response.json_data, dict):
            payload = response.json_data.get("data") if isinstance(response.json_data.get("data"), dict) else {}
            return {"code": response.json_data.get("code", 0), "msg": response.json_data.get("msg", "ok"), "data": normalize_fence_payload(payload)}
    except UpstreamApiError:
        pass
    fence = db.query(Fence).filter(Fence.id == id).first()
    if not fence:
        raise HTTPException(status_code=404, detail="Fence not found")
    return {"code": 0, "msg": "ok", "data": normalize_fence_payload(_local_fence(fence))}


@router.get("/v1/fences")
def get_fence_list(
    is_page: bool = Query(False),
    page_index: int = Query(1),
    page_size: int = Query(20),
    event_type: int | None = Query(None),
    fence_name: str | None = Query(None),
    company_id: int | None = Query(None),
    fence_shape: str | None = Query(None),
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db)
):
    upstream_items: list[dict] = []
    upstream_total = 0
    try:
        params = {
            "is_page": str(is_page).lower(),
            "page_index": page_index,
            "page_size": page_size,
            "event_type": event_type,
            "fence_name": fence_name,
            "company_id": company_id,
            "fence_shape": fence_shape,
        }
        response = request_upstream("GET", "/v1/fences", token=token, params=params)
        if response.ok and isinstance(response.json_data, dict):
            payload = response.json_data.get("data") if isinstance(response.json_data.get("data"), dict) else {}
            upstream_items = [normalize_fence_payload(item) for item in payload.get("items", []) or []]
            upstream_total = int(pick(payload, "total", default=len(upstream_items)) or len(upstream_items))
    except UpstreamApiError:
        pass

    query = db.query(Fence)
    if event_type is not None:
        query = query.filter(Fence.event_type == event_type)
    if fence_name:
        query = query.filter(Fence.fence_name.like(f"%{fence_name}%"))
    if company_id is not None:
        query = query.filter(Fence.company_id == company_id)
    if fence_shape:
        query = query.filter(Fence.fence_shape == fence_shape)
    local_total = query.count()
    local_items = query.offset((page_index - 1) * page_size).limit(page_size).all() if is_page else query.all()
    local_normalized = [normalize_fence_payload(_local_fence(fence)) for fence in local_items]

    # Merge: upstream first, then local (dedup by id)
    seen_ids = {item.get("id") for item in upstream_items if item.get("id")}
    merged = list(upstream_items)
    for item in local_normalized:
        if item.get("id") not in seen_ids:
            merged.append(item)
            seen_ids.add(item.get("id"))

    total = max(upstream_total, len(merged))
    return {"code": 0, "msg": "ok", "data": _paginate_payload(merged, page_index, page_size, total)}
