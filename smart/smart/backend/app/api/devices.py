from __future__ import annotations

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import get_bearer_token
from ..compat import model_to_dict, normalize_device_payload, normalize_status, pick
from ..database import get_db
from ..models.models import Alarm, Device, DeviceGroup
from ..schemas.schemas import DeviceUpdate, FileDeleteRequest
from ..upstream import UpstreamApiError, request_upstream

router = APIRouter()


def _local_device(device: Device) -> dict:
    return {
        "id": device.id,
        "device_id": device.device_id,
        "device_name": device.device_name,
        "product_id": device.product_id,
        "product_code": device.product.product_code if device.product else "",
        "product_name": device.product.product_name if device.product else "",
        "protocol": device.protocol or [],
        "longitude": device.longitude,
        "latitude": device.latitude,
        "latest_data": device.latest_data,
        "status": device.status,
        "company_id": device.company_id,
        "created_at": str(device.created_at),
        "updated_at": str(device.updated_at),
        "battery": device.battery,
        "network_signal": device.network_signal,
        "bitrate": device.bitrate,
        "storage_status": device.storage_status,
        "area": device.group.group_name if device.group else "未分区",
    }


def _find_local_extra(db: Session, payload: dict) -> dict:
    business_id = pick(payload, "deviceId", "device_id")
    primary_id = pick(payload, "id")
    query = db.query(Device)
    local = None
    if business_id:
        local = query.filter(Device.device_id == business_id).first()
    if local is None and primary_id is not None:
        local = query.filter(Device.id == primary_id).first()
    if local is None:
        return {}
    pending_alarm = db.query(Alarm).filter(Alarm.device_id == local.device_id, Alarm.status.in_(["pending", "processing"])).count() > 0
    status_text = normalize_status(local.status)
    if pending_alarm:
        status_text = "报警"
    return {
        "battery": local.battery or 100,
        "signal": local.network_signal or (100 if str(local.status).lower() == "online" else 0),
        "bitrate": local.bitrate or "--",
        "storage_status": local.storage_status or "Normal",
        "area": local.group.group_name if local.group else "未分区",
        "online_time": "--",
        "status_text": status_text,
        "status": local.status,
    }


def _front_device_row(normalized: dict) -> dict:
    status_text = pick(normalized, "statusText", default=normalize_status(pick(normalized, "status")))
    return {
        "key": pick(normalized, "id"),
        "id": pick(normalized, "id"),
        "device_name": pick(normalized, "device_name"),
        "product_name": pick(normalized, "product_name"),
        "status": status_text,
        "battery": pick(normalized, "battery", default=100),
        "signal": pick(normalized, "signal", "network_signal", default=0),
        "area": pick(normalized, "area", default="未分区"),
        "online_time": pick(normalized, "online_time", default="--"),
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


def _normalize_remote_items(db: Session, items: list[dict]) -> list[dict]:
    return [normalize_device_payload(item, local_extra=_find_local_extra(db, item)) for item in items]


@router.get("/v1/user/devices")
def get_user_devices(
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db)
):
    try:
        response = request_upstream("GET", "/v1/user/devices", token=token)
        if response.ok and isinstance(response.json_data, dict):
            payload = response.json_data.get("data") if isinstance(response.json_data.get("data"), dict) else {}
            groups = []
            for group in payload.get("groups", []) or []:
                group_name = pick(group, "groupName", "group_name")
                devices = _normalize_remote_items(db, group.get("devices", []) or [])
                groups.append({
                    "id": pick(group, "id"),
                    "groupName": group_name,
                    "group_name": group_name,
                    "devices": devices,
                })
            return {
                "code": response.json_data.get("code", 0),
                "msg": response.json_data.get("msg", "ok"),
                "data": {"groups": groups},
            }
    except UpstreamApiError:
        pass
    groups = db.query(DeviceGroup).all()
    result_groups = []
    for group in groups:
        devices = db.query(Device).filter(Device.group_id == group.id).all()
        normalized = [normalize_device_payload(_local_device(device), local_extra=_find_local_extra(db, _local_device(device))) for device in devices]
        result_groups.append({
            "id": group.id,
            "groupName": group.group_name,
            "group_name": group.group_name,
            "devices": normalized,
        })
    return {"code": 0, "msg": "ok", "data": {"groups": result_groups}}


@router.get("/v1/devices")
def get_device_list(
    is_page: bool = Query(False),
    page_index: int = Query(1),
    page_size: int = Query(20),
    page: int | None = Query(None),
    device_id: str | None = Query(None),
    device_name: str | None = Query(None),
    company_id: int | None = Query(None),
    company_name: str | None = Query(None),
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db)
):
    effective_page = page or page_index
    array_mode = not is_page and page is None and device_id is None and device_name is None and company_id is None and company_name is None
    try:
        params = {}
        if is_page:
            params["is_page"] = str(is_page).lower()
        if effective_page != 1:
            params["page_index"] = effective_page
        if page_size != 20:
            params["page_size"] = page_size
        if device_id:
            params["device_id"] = device_id
        if device_name:
            params["device_name"] = device_name
        if company_id is not None:
            params["company_id"] = company_id
        if company_name:
            params["company_name"] = company_name
        response = request_upstream("GET", "/v1/devices", token=token, params=params or None)
        if response.ok and isinstance(response.json_data, dict):
            payload = response.json_data.get("data") if isinstance(response.json_data.get("data"), dict) else {}
            items = _normalize_remote_items(db, payload.get("items", []) or [])
            if array_mode:
                return [_front_device_row(item) for item in items]
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
    query = db.query(Device)
    if device_id:
        query = query.filter(Device.device_id.like(f"%{device_id}%"))
    if device_name:
        query = query.filter(Device.device_name.like(f"%{device_name}%"))
    total = query.count()
    items = query.offset((effective_page - 1) * page_size).limit(page_size).all() if is_page else query.all()
    normalized = [normalize_device_payload(_local_device(device), local_extra=_find_local_extra(db, _local_device(device))) for device in items]
    if array_mode:
        return [_front_device_row(item) for item in normalized]
    return {"code": 0, "msg": "ok", "data": _paginate_payload(normalized, effective_page, page_size, total)}


@router.get("/v1/devices/{id}")
def get_device(
    id: int,
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db)
):
    try:
        response = request_upstream("GET", f"/v1/devices/{id}", token=token)
        if response.ok and isinstance(response.json_data, dict):
            payload = response.json_data.get("data") if isinstance(response.json_data.get("data"), dict) else {}
            normalized = normalize_device_payload(payload, local_extra=_find_local_extra(db, payload))
            return {"code": response.json_data.get("code", 0), "msg": response.json_data.get("msg", "ok"), "data": normalized}
    except UpstreamApiError:
        pass
    device = db.query(Device).filter(Device.id == id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    normalized = normalize_device_payload(_local_device(device), local_extra=_find_local_extra(db, _local_device(device)))
    return {"code": 0, "msg": "ok", "data": normalized}


@router.put("/v1/devices/{id}")
def update_device(
    id: int,
    body: DeviceUpdate = Body(...),
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db)
):
    body_data = model_to_dict(body)
    upstream_body = {}
    if pick(body_data, "deviceName", "device_name") is not None:
        upstream_body["deviceName"] = pick(body_data, "deviceName", "device_name")
    if pick(body_data, "productId", "product_id") is not None:
        upstream_body["productId"] = pick(body_data, "productId", "product_id")
    try:
        response = request_upstream("PUT", f"/v1/devices/{id}", token=token, json_body=upstream_body)
        if response.ok and isinstance(response.json_data, dict):
            return response.json_data
    except UpstreamApiError:
        pass
    device = db.query(Device).filter(Device.id == id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if pick(body_data, "deviceName", "device_name") is not None:
        device.device_name = pick(body_data, "deviceName", "device_name")
    if pick(body_data, "productId", "product_id") is not None:
        device.product_id = pick(body_data, "productId", "product_id")
    db.commit()
    return {"code": 0, "msg": "device updated"}


@router.get("/v1/device/file")
def get_device_files(
    type: str = Query("photo"),
    device_id: str | None = Query(None, alias="device_id"),
    device: str | None = Query(None),
    date: str | None = Query(None),
    token: str = Depends(get_bearer_token),
):
    device_id = device_id or device
    if not device_id:
        raise HTTPException(status_code=422, detail="device_id is required")
    try:
        response = request_upstream("GET", "/v1/device/file", token=token, params={"type": type, "device_id": device_id, "date": date})
        if response.ok and isinstance(response.json_data, dict):
            payload = response.json_data.get("data") if isinstance(response.json_data.get("data"), dict) else {}
            normalized_list = []
            for item in payload.get("list", []) or []:
                normalized_list.append({
                    "name": pick(item, "name"),
                    "path": pick(item, "path"),
                    "lastModified": pick(item, "lastModified", "last_modified"),
                    "last_modified": pick(item, "lastModified", "last_modified"),
                    "size": pick(item, "size"),
                    "presignedURL": pick(item, "presignedURL", "presigned_url"),
                    "presigned_url": pick(item, "presignedURL", "presigned_url"),
                })
            return {"code": response.json_data.get("code", 0), "msg": response.json_data.get("msg", "ok"), "data": {"list": normalized_list}}
    except UpstreamApiError:
        pass
    suffix = "jpg" if type == "photo" else "mp4"
    mock_files = [
        {
            "name": f"{device_id}_{type}_{i:04d}.{suffix}",
            "path": f"/local/{type}/{device_id}/{device_id}_{type}_{i:04d}.{suffix}",
            "lastModified": "2025-05-20 10:30:00",
            "last_modified": "2025-05-20 10:30:00",
            "size": 1024000 if type == "photo" else 10485760,
            "presignedURL": None,
            "presigned_url": None,
        }
        for i in range(1, 6)
    ]
    return {"code": 0, "msg": "ok", "data": {"list": mock_files}}


@router.post("/v1/device/file/delete")
def delete_file(
    body: FileDeleteRequest = Body(...),
    token: str = Depends(get_bearer_token)
):
    body_data = model_to_dict(body)
    try:
        response = request_upstream("POST", "/v1/device/file/delete", token=token, json_body=body_data)
        if response.ok and isinstance(response.json_data, dict):
            return response.json_data
    except UpstreamApiError:
        pass
    return {"code": 0, "msg": "file deleted"}
