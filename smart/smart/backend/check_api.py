from app.main import app
paths = set()
for r in app.routes:
    if hasattr(r, "path") and hasattr(r, "methods"):
        for m in r.methods:
            paths.add(f"{m} {r.path}")

checks = {
    "POST /login": "Login",
    "GET /v1/user": "User Info",
    "PUT /v1/users/{username}/password": "Change Password",
    "GET /v1/user/devices": "User Devices",
    "GET /v1/devices/{id}": "Device Detail",
    "GET /v1/devices": "Device List",
    "PUT /v1/devices/{id}": "Device Update",
    "GET /v1/device/file": "Device Files",
    "POST /v1/device/file/delete": "File Delete",
    "POST /v1/fences": "Create Fence",
    "PUT /v1/fences/{id}": "Update Fence",
    "DELETE /v1/fences/{id}": "Delete Fence",
    "GET /v1/fences/{id}": "Fence Detail",
    "GET /v1/fences": "Fence List",
    "GET /v1/locations": "Track History",
    "GET /v1/alarms": "Alarm List",
    "GET /v1/alarms/{id}": "Alarm Detail",
    "PUT /v1/alarms/{id}": "Alarm Update",
    "POST /v1/talkgroups": "Create TalkGroup",
    "DELETE /v1/talkgroups/{id}": "Delete TalkGroup",
    "PUT /v1/talkgroups/{id}": "Update TalkGroup",
    "GET /v1/talkgroups": "Find TalkGroups",
    "POST /v1/send-talkgroup-command": "Talk Command",
    "GET /api/v1/stream/start": "Stream Start",
    "GET /api/v1/stream/stop": "Stream Stop",
    "GET /api/v1/playback/recordlist": "Record List",
    "GET /api/v1/playback/start": "Playback Start",
    "GET /api/v1/playback/stop": "Playback Stop",
    "GET /api/v1/playback/control": "Playback Control",
    "GET /api/v1/playback/streaminfo": "Stream Info",
    "GET /bvcsp/v1/pu/info/{puid}": "PU Info",
    "POST /bvcsp/v1/dialog/device/webrtc": "WebRTC Dialog",
    "POST /bvcsp/v1/dialog/device/bvrtc": "BVRTC Dialog",
    "POST /bvcsp/v1/dialog/close/{dialogid}": "Close Dialog",
    "POST /bvcsp/v1/recordfile/filter": "Platform File Filter",
    "POST /bvcsp/v1/pu/recordfile/filter/{puid}": "Device File Filter",
    "GET /bvnru/v1/download/{fileid}": "Download File",
    "GET /bvnru/v1/pu/download/{puid}/{fileid}": "Device Download",
    "POST /webrtc/token": "LiveKit Token",
}

ok = 0
for path, name in checks.items():
    found = path in paths
    status = "OK" if found else "MISSING"
    if found: ok += 1
    print(f"  [{status}] {path}")

print(f"\nMatched: {ok}/{len(checks)}")
