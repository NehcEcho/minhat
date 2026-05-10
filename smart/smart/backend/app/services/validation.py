from __future__ import annotations

from typing import Any


class ValidationError(Exception):
    pass


def _ensure_body(body: dict[str, Any]) -> None:
    if not body:
        raise ValidationError("请求体不能为空")


def _require_text(body: dict[str, Any], field: str) -> None:
    val = body.get(field)
    if val is None or (isinstance(val, str) and not val.strip()):
        raise ValidationError(f"{field} 不能为空")


def _require_present(body: dict[str, Any], field: str) -> None:
    if field not in body or body[field] is None:
        raise ValidationError(f"{field} 不能为空")


def _require_array(body: dict[str, Any], field: str) -> None:
    val = body.get(field)
    if val is None or not isinstance(val, list):
        raise ValidationError(f"{field} 必须是数组")


def validate_fence_payload(body: dict[str, Any], *, create_mode: bool) -> None:
    _ensure_body(body)
    if create_mode:
        _require_text(body, "fenceName")
        _require_text(body, "startTimeStr")
        _require_text(body, "endTimeStr")
        _require_present(body, "eventType")
        _require_array(body, "deviceIndexIds")
        _require_text(body, "fenceShape")

    shape = body.get("fenceShape")
    if shape is not None and isinstance(shape, str) and shape.strip():
        shape_lower = shape.strip().lower()
        if shape_lower == "circle":
            circle = body.get("circleFenceData")
            if circle is None or not isinstance(circle, dict):
                raise ValidationError("Circle 围栏必须传 circleFenceData")
            _require_present(circle, "radius")
            center = circle.get("center")
            if center is None or not isinstance(center, dict):
                raise ValidationError("Circle 围栏必须传 center")
            _require_text(center, "longitude")
            _require_text(center, "latitude")

        if shape_lower == "polygon":
            polygon = body.get("polygonFenceData")
            if polygon is None or not isinstance(polygon, list) or len(polygon) == 0:
                raise ValidationError("Polygon 围栏必须传 polygonFenceData 数组")


def validate_talk_command(body: dict[str, Any]) -> None:
    _ensure_body(body)
    _require_present(body, "groupId")
    _require_text(body, "command")
    command = str(body["command"]).strip()
    if command in ("8010", "8011"):
        _require_text(body, "clientId")
    if command in ("8014", "8015"):
        _require_text(body, "deviceId")


def validate_livekit_request(body: dict[str, Any]) -> None:
    devices = body.get("devices")
    meeting_mode = body.get("meeting")

    if meeting_mode is not True and isinstance(devices, list) and len(devices) > 1:
        raise ValidationError("非会议模式下 devices 不能超过 1 个")
