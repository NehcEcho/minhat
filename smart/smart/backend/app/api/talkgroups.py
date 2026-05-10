from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import get_bearer_token, get_current_user
from ..compat import normalize_talk_group_payload, pick
from ..database import get_db
from ..models.models import Device, TalkGroup
from ..services.validation import ValidationError, validate_talk_command
from ..upstream import UpstreamApiError, request_upstream

router = APIRouter()


def _local_group(group: TalkGroup, db: Session) -> dict:
    devices = []
    members = db.query(Device).filter(Device.id.in_(group.member_device_ids or [])).all() if group.member_device_ids else []
    for device in members:
        devices.append({
            "id": device.id,
            "device_id": device.device_id,
            "device_name": device.device_name,
            "status": device.status,
        })
    return {
        "id": group.id,
        "group_name": group.group_name,
        "devices": devices,
    }


@router.post("/v1/talkgroups")
def create_talkgroup(
    body: dict = Body(...),
    user: dict = Depends(get_current_user),
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db)
):
    upstream_body = {
        "groupName": pick(body, "groupName", "group_name"),
        "deviceList": pick(body, "deviceList", "device_list", default=[]),
    }
    try:
        response = request_upstream("POST", "/v1/talkgroups", token=token, json_body=upstream_body)
        if response.ok and isinstance(response.json_data, dict):
            return response.json_data
    except UpstreamApiError:
        pass
    group = TalkGroup(
        group_name=pick(body, "groupName", "group_name"),
        group_code=pick(body, "groupCode", "group_code", default=pick(body, "groupName", "group_name")),
        company_id=user.get("company_id") or 1,
        member_device_ids=pick(body, "deviceList", "device_list", default=[]),
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return {"code": 0, "msg": "ok", "data": group.id}


@router.delete("/v1/talkgroups/{id}")
def delete_talkgroup(
    id: int,
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db)
):
    try:
        response = request_upstream("DELETE", f"/v1/talkgroups/{id}", token=token)
        if response.ok and isinstance(response.json_data, dict):
            return response.json_data
    except UpstreamApiError:
        pass
    group = db.query(TalkGroup).filter(TalkGroup.id == id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    db.delete(group)
    db.commit()
    return {"code": 0, "msg": "ok"}


@router.put("/v1/talkgroups/{id}")
def update_talkgroup(
    id: int,
    body: dict = Body(...),
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db)
):
    upstream_body = {
        "groupName": pick(body, "groupName", "group_name"),
        "deviceList": pick(body, "deviceList", "device_list", default=[]),
    }
    try:
        response = request_upstream("PUT", f"/v1/talkgroups/{id}", token=token, json_body=upstream_body)
        if response.ok and isinstance(response.json_data, dict):
            return response.json_data
    except UpstreamApiError:
        pass
    group = db.query(TalkGroup).filter(TalkGroup.id == id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    group.group_name = pick(body, "groupName", "group_name")
    group.member_device_ids = pick(body, "deviceList", "device_list", default=[])
    db.commit()
    return {"code": 0, "msg": "ok"}


@router.get("/v1/talkgroups")
def find_talkgroups(
    group_name: str = Query(..., alias="group_name"),
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db)
):
    try:
        response = request_upstream("GET", "/v1/talkgroups", token=token, params={"group_name": group_name})
        if response.ok and isinstance(response.json_data, dict):
            payload = response.json_data.get("data") if isinstance(response.json_data.get("data"), list) else []
            return {"code": response.json_data.get("code", 0), "msg": response.json_data.get("msg", "ok"), "data": [normalize_talk_group_payload(item) for item in payload]}
    except UpstreamApiError:
        pass
    groups = db.query(TalkGroup).filter(TalkGroup.group_name.like(f"%{group_name}%")).all()
    return {"code": 0, "msg": "ok", "data": [normalize_talk_group_payload(_local_group(group, db)) for group in groups]}


@router.post("/v1/send-talkgroup-command")
def send_talkgroup_command(
    body: dict = Body(...),
    token: str = Depends(get_bearer_token)
):
    try:
        validate_talk_command(body)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    try:
        response = request_upstream("POST", "/v1/send-talkgroup-command", token=token, json_body=body)
        if response.ok and isinstance(response.json_data, dict):
            return response.json_data
    except UpstreamApiError:
        pass
    return {"code": 0, "msg": "ok"}
