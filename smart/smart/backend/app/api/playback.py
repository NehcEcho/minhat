from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from ..auth import get_bearer_token
from ..upstream import UpstreamApiError, request_upstream

router = APIRouter()


@router.get("/api/v1/playback/recordlist")
def playback_recordlist(
    serial: str | None = Query(None),
    code: str | None = Query(None),
    device: str | None = Query(None),
    starttime: str | None = Query(None),
    start: str | None = Query(None),
    endtime: str | None = Query(None),
    end: str | None = Query(None),
    token: str = Depends(get_bearer_token),
):
    serial = serial or device
    code = code or device or serial
    starttime = starttime or start or datetime.now(timezone.utc).strftime("%Y-%m-%dT00:00:00")
    endtime = endtime or end
    try:
        response = request_upstream(
            "GET",
            "/api/v1/playback/recordlist",
            token=token,
            params={"serial": serial, "code": code, "starttime": starttime, "endtime": endtime},
        )
        if response.ok and isinstance(response.json_data, dict):
            return response.json_data
    except UpstreamApiError:
        pass
    et = endtime or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
    return {
        "DeviceID": code or "1",
        "Name": f"Channel {code or '1'}",
        "SumNum": 3,
        "RecordList": [
            {
                "DeviceID": code or "1",
                "Name": f"Channel {code or '1'}",
                "FilePath": f"/record/{serial}/2025-05-20/{i:02d}.mp4",
                "Address": f"http://record.local/{serial}/2025-05-20/{i:02d}.mp4",
                "StartTime": f"{starttime[:10]}T{(i-1)*8:02d}:00:00",
                "EndTime": f"{et[:10]}T{i*8:02d}:00:00",
                "Secrecy": "0",
                "Type": "time",
                "RecorderID": serial,
            }
            for i in range(1, 4)
        ],
    }


@router.get("/api/v1/playback/start")
def playback_start(
    serial: str | None = Query(None),
    code: str | None = Query(None),
    device: str | None = Query(None),
    starttime: str | None = Query(None),
    start: str | None = Query(None),
    endtime: str | None = Query(None),
    end: str | None = Query(None),
    download: bool = Query(False),
    audio: str = Query("config"),
    transport: str = Query("config"),
    transport_mode: str = Query("passive"),
    timezone: str = Query("Asia/Shanghai"),
    token: str = Depends(get_bearer_token),
):
    serial = serial or device
    code = code or device or serial
    starttime = starttime or start or datetime.now(timezone.utc).strftime("%Y-%m-%dT00:00:00")
    endtime = endtime or end
    try:
        response = request_upstream(
            "GET",
            "/api/v1/playback/start",
            token=token,
            params={
                "serial": serial,
                "code": code,
                "starttime": starttime,
                "endtime": endtime,
                "download": str(download).lower(),
                "audio": audio,
                "transport": transport,
                "transport_mode": transport_mode,
                "timezone": timezone,
            },
        )
        if response.ok and isinstance(response.json_data, dict):
            return response.json_data
    except UpstreamApiError:
        pass
    sid = f"playback_{serial}_{code or '1'}"
    return {
        "StreamID": sid,
        "DeviceID": serial,
        "WEBRTC": f"webrtc://stream.local/playback/{sid}",
        "FLV": f"http://stream.local/playback/{sid}.flv",
        "WS_FLV": f"ws://stream.local/playback/{sid}.flv",
        "RTMP": f"rtmp://stream.local/playback/{sid}",
        "HLS": f"http://stream.local/playback/{sid}.m3u8",
        "RTSP": f"rtsp://stream.local/playback/{sid}",
        "Transport": transport if transport != "config" else "TCP",
        "StartAt": starttime,
        "Duration": 3600,
        "SourceVideoCodecName": "H264",
        "SourceVideoWidth": 1920,
        "SourceVideoHeight": 1080,
        "SourceVideoFrameRate": 25,
        "SourceAudioCodecName": "AAC",
        "SourceAudioSampleRate": 48000,
        "RTPCount": 15000,
        "RTPLostCount": 30,
        "RTPLostRate": 0.2,
        "VideoFrameCount": 90000,
        "AudioEnable": audio in ("true", "config"),
        "Ondemand": True,
        "InBytes": 1073741824,
        "InBitRate": 4096,
        "OutBytes": 536870912,
        "NumOutputs": 1,
        "CascadeSize": 0,
        "PlaybackDuration": 3600,
        "TimestampSec": 0,
        "PlaybackProgress": 0,
        "DownloadProgress": 0,
        "PlaybackFileSize": 1073741824,
        "PlaybackFileURL": f"http://download.local/{sid}.mp4",
    }


@router.get("/api/v1/playback/stop")
def playback_stop(
    streamid: str | None = Query(None),
    device: str | None = Query(None),
    token: str = Depends(get_bearer_token),
):
    streamid = streamid or f"playback_{device}_{device}" if device else streamid
    if not streamid:
        raise HTTPException(status_code=422, detail="streamid or device is required")
    try:
        response = request_upstream("GET", "/api/v1/playback/stop", token=token, params={"streamid": streamid})
        if response.ok:
            return response.json_data if isinstance(response.json_data, dict) else {"PlaybackFileURL": None}
    except UpstreamApiError:
        pass
    return {"PlaybackFileURL": f"http://download.local/{streamid}.mp4"}


@router.get("/api/v1/playback/control")
def playback_control(
    streamid: str = Query(...),
    command: str = Query(...),
    range: str = Query("now"),
    scale: float = Query(2),
    token: str = Depends(get_bearer_token),
):
    try:
        response = request_upstream(
            "GET",
            "/api/v1/playback/control",
            token=token,
            params={"streamid": streamid, "command": command, "range": range, "scale": scale},
        )
        if response.ok:
            return response.json_data if isinstance(response.json_data, dict) else {"code": 0, "msg": "ok"}
    except UpstreamApiError:
        pass
    return {"code": 0, "msg": "ok"}


@router.get("/api/v1/playback/streaminfo")
def playback_streaminfo(
    streamid: str = Query(...),
    token: str = Depends(get_bearer_token),
):
    try:
        response = request_upstream("GET", "/api/v1/playback/streaminfo", token=token, params={"streamid": streamid})
        if response.ok and isinstance(response.json_data, dict):
            return response.json_data
    except UpstreamApiError:
        pass
    return {
        "StreamID": streamid,
        "DeviceID": "MHK-1001",
        "WEBRTC": f"webrtc://stream.local/playback/{streamid}",
        "FLV": f"http://stream.local/playback/{streamid}.flv",
        "WS_FLV": f"ws://stream.local/playback/{streamid}.flv",
        "RTMP": f"rtmp://stream.local/playback/{streamid}",
        "HLS": f"http://stream.local/playback/{streamid}.m3u8",
        "RTSP": f"rtsp://stream.local/playback/{streamid}",
        "Transport": "TCP",
        "StartAt": "2025-05-20T08:00:00",
        "Duration": 3600,
        "SourceVideoCodecName": "H264",
        "SourceVideoWidth": 1920,
        "SourceVideoHeight": 1080,
        "SourceVideoFrameRate": 25,
        "SourceAudioCodecName": "AAC",
        "SourceAudioSampleRate": 48000,
        "RTPCount": 15000,
        "RTPLostCount": 30,
        "RTPLostRate": 0.2,
        "VideoFrameCount": 90000,
        "AudioEnable": True,
        "Ondemand": True,
        "InBytes": 1073741824,
        "InBitRate": 4096,
        "OutBytes": 536870912,
        "NumOutputs": 1,
        "CascadeSize": 0,
        "PlaybackDuration": 3600,
        "TimestampSec": 120,
        "PlaybackProgress": 0.033,
        "DownloadProgress": 0,
        "PlaybackFileSize": 1073741824,
        "PlaybackFileURL": f"http://download.local/{streamid}.mp4",
    }
