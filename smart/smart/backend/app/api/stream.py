from datetime import datetime, timezone
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Query

from ..auth import get_bearer_token
from ..settings import settings
from ..upstream import UpstreamApiError, request_upstream

router = APIRouter()


@router.get("/api/v1/control/ws-talk-url")
def get_talk_ws_url(
    serial: str = Query(...),
    code: str | None = Query(None),
    format: str = Query("pcm"),
    token: str = Depends(get_bearer_token),
):
    code = code or serial
    relay_path = f"/api/proxy/api/v1/control/ws-talk/{serial}/{code}"
    query_params = urlencode({"serial": serial, "code": code, "token": token, "format": format})
    helper_relay_path = f"/ws/talk-relay?{query_params}"
    remote_url = f"{settings.talk_websocket_base_url}/api/v1/control/ws-talk/{serial}/{code}"

    return {
        "code": 0,
        "msg": "ok",
        "data": {
            "relayPath": relay_path,
            "helperRelayPath": helper_relay_path,
            "remoteUrl": remote_url,
            "remoteWebsocketBaseUrl": settings.talk_websocket_base_url,
            "serial": serial,
            "code": code,
            "format": format,
        },
    }


@router.get("/api/v1/stream/start")
def stream_start(
    serial: str | None = Query(None),
    code: str | None = Query(None),
    device: str | None = Query(None),
    audio: str = Query("config"),
    token: str = Depends(get_bearer_token),
):
    serial = serial or device
    code = code or device or serial
    if not serial:
        raise HTTPException(status_code=422, detail="serial or device is required")
    params = {"serial": serial, "code": code, "audio": audio}
    try:
        response = request_upstream("GET", "/api/v1/stream/start", token=token, params=params)
        if response.ok and isinstance(response.json_data, dict):
            return response.json_data
    except UpstreamApiError:
        pass
    sid = f"stream_{serial}_{code}"
    return {
        "StreamID": sid,
        "SMSID": "SMS001",
        "DeviceID": serial,
        "ChannelID": code,
        "WEBRTC": f"webrtc://stream.local/live/{sid}",
        "FLV": f"http://stream.local/live/{sid}.flv",
        "WS_FLV": f"ws://stream.local/live/{sid}.flv",
        "RTMP": f"rtmp://stream.local/live/{sid}",
        "HLS": f"http://stream.local/live/{sid}.m3u8",
        "RTSP": f"rtsp://stream.local/live/{sid}",
        "Transport": "TCP",
        "StartAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "AudioEnable": audio in ("true", "config"),
    }


@router.get("/api/v1/stream/stop")
def stream_stop(
    serial: str | None = Query(None),
    code: str | None = Query(None),
    device: str | None = Query(None),
    check_outputs: str = Query("false"),
    token: str = Depends(get_bearer_token),
):
    serial = serial or device
    code = code or device or serial
    if not serial:
        raise HTTPException(status_code=422, detail="serial or device is required")
    try:
        response = request_upstream(
            "GET",
            "/api/v1/stream/stop",
            token=token,
            params={"serial": serial, "code": code, "check_outputs": check_outputs},
        )
        if response.ok:
            return response.json_data if isinstance(response.json_data, dict) else {"code": 0, "msg": "ok"}
    except UpstreamApiError:
        pass
    return {"code": 0, "msg": "ok"}
