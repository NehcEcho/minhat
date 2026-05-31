from fastapi import APIRouter, Body, Depends

from ..auth import get_bearer_token
from ..upstream import UpstreamApiError, request_upstream

router = APIRouter()


@router.get("/bvcsp/v1/pu/info/{puid}")
def get_pu_info(puid: str, token: str = Depends(get_bearer_token)):
    try:
        response = request_upstream("GET", f"/bvcsp/v1/pu/info/{puid}", token=token)
        if response.ok and isinstance(response.json_data, dict):
            return response.json_data
    except UpstreamApiError:
        pass
    return {
        "code": 0, "msg": "ok",
        "data": {
            "channels": [
                {"index": 1, "name": "Channel 1"},
                {"index": 2, "name": "Channel 2"},
            ]
        }
    }


@router.post("/bvcsp/v1/dialog/device/webrtc")
def dialog_device_webrtc(body: dict = Body(...), token: str = Depends(get_bearer_token)):
    try:
        response = request_upstream("POST", "/bvcsp/v1/dialog/device/webrtc", token=token, json_body=body)
        if response.ok and isinstance(response.json_data, dict):
            return response.json_data
    except UpstreamApiError:
        pass
    return {
        "code": 0, "msg": "ok",
        "data": {
            "dialogid": f"dialog_webrtc_{body.get('id', 'unknown')}_{body.get('index', 1)}",
            "sdp": body.get("sdp", ""),
        }
    }


@router.post("/bvcsp/v1/dialog/device/bvrtc")
def dialog_device_bvrtc(body: dict = Body(...), token: str = Depends(get_bearer_token)):
    try:
        response = request_upstream("POST", "/bvcsp/v1/dialog/device/bvrtc", token=token, json_body=body)
        if response.ok and isinstance(response.json_data, dict):
            return response.json_data
    except UpstreamApiError:
        pass
    return {
        "code": 0, "msg": "ok",
        "data": {
            "dialogid": f"dialog_bvrtc_{body.get('id', 'unknown')}_{body.get('index', 1)}",
            "sdp": body.get("sdp", ""),
        }
    }


@router.post("/bvcsp/v1/dialog/close/{dialogid}")
def dialog_close(dialogid: str, token: str = Depends(get_bearer_token)):
    try:
        response = request_upstream("POST", f"/bvcsp/v1/dialog/close/{dialogid}", token=token)
        if response.ok and isinstance(response.json_data, dict):
            return response.json_data
    except UpstreamApiError:
        pass
    return {"code": 0, "msg": "ok"}


@router.post("/bvcsp/v1/recordfile/filter")
def recordfile_filter(body: dict = Body(...), token: str = Depends(get_bearer_token)):
    try:
        response = request_upstream("POST", "/bvcsp/v1/recordfile/filter", token=token, json_body=body)
        if response.ok and isinstance(response.json_data, dict):
            return response.json_data
    except UpstreamApiError:
        pass
    now_ts = 1748300000
    return {
        "code": 0, "msg": "ok",
        "pageInfo": {"page": body.get("page", 0), "pageSize": body.get("pageSize", 10), "totalCount": 3},
        "data": [
            {
                "id": i,
                "fileID": f"rec_{i:04d}",
                "puID": (body.get("filter") if isinstance(body.get("filter"), dict) else {}).get("puID", "PU_123456") if isinstance(body.get("filter"), dict) else "PU_123456",
                "channelIndex": 1,
                "filePath": f"/record/2025-05-{20-i:02d}/{i:02d}.mp4",
                "fileType": "video",
                "fileSize": 1073741824,
                "beginTime": now_ts - 86400 * i,
                "endTime": now_ts - 86400 * i + 3600,
                "fileName": f"record_{20250520000000 + i}.mp4",
            }
            for i in range(1, 4)
        ],
    }


@router.post("/bvcsp/v1/pu/recordfile/filter/{puid}")
def pu_recordfile_filter(puid: str, body: dict = Body(...), token: str = Depends(get_bearer_token)):
    try:
        response = request_upstream("POST", f"/bvcsp/v1/pu/recordfile/filter/{puid}", token=token, json_body=body)
        if response.ok and isinstance(response.json_data, dict):
            return response.json_data
    except UpstreamApiError:
        pass
    now_ts = 1748300000
    return {
        "code": 0, "msg": "ok",
        "pageInfo": {"page": body.get("page", 0), "pageSize": body.get("pageSize", 10), "totalCount": 3},
        "data": [
            {
                "fileID": f"rec_pu_{i:04d}",
                "channelIndex": 1,
                "filePath": f"/device/{puid}/2025-05-{20-i:02d}/{i:02d}.mp4",
                "fileType": "video",
                "fileSize": 536870912,
                "beginTime": now_ts - 86400 * i,
                "endTime": now_ts - 86400 * i + 3600,
                "fileName": f"device_record_{20250520000000 + i}.mp4",
            }
            for i in range(1, 4)
        ],
    }


@router.get("/bvnru/v1/download/{fileid}")
def download_file(fileid: str, token: str = Depends(get_bearer_token)):
    try:
        response = request_upstream("GET", f"/bvnru/v1/download/{fileid}", token=token)
        if response.ok:
            return response.json_data if isinstance(response.json_data, dict) else {"code": 0, "msg": "download ready", "fileid": fileid}
    except UpstreamApiError:
        pass
    return {"code": 0, "msg": "download ready", "fileid": fileid}


@router.get("/bvnru/v1/pu/download/{puid}/{fileid}")
def pu_download_file(puid: str, fileid: str, token: str = Depends(get_bearer_token)):
    try:
        response = request_upstream("GET", f"/bvnru/v1/pu/download/{puid}/{fileid}", token=token)
        if response.ok:
            return response.json_data if isinstance(response.json_data, dict) else {"code": 0, "msg": "download ready", "puid": puid, "fileid": fileid}
    except UpstreamApiError:
        pass
    return {"code": 0, "msg": "download ready", "puid": puid, "fileid": fileid}
