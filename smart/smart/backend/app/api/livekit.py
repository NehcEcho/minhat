import uuid
from fastapi import APIRouter, Body, Depends, HTTPException
from ..auth import get_bearer_token
from ..services.validation import ValidationError, validate_livekit_request
from ..upstream import UpstreamApiError, request_upstream

router = APIRouter()


@router.post("/webrtc/token")
def webrtc_token(body: dict = Body(...), token: str = Depends(get_bearer_token)):
    try:
        validate_livekit_request(body)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    try:
        response = request_upstream("POST", "/webrtc/token", token=token, json_body=body)
        if response.ok and isinstance(response.json_data, dict):
            return response.json_data
    except UpstreamApiError:
        pass
    room = body.get("roomName") or f"room_{uuid.uuid4().hex[:8]}"
    return {
        "code": 0, "msg": "ok",
        "data": {
            "roomName": room,
            "token": f"livekit_token_{uuid.uuid4().hex}",
        }
    }
