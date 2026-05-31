from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json

router = APIRouter()

_clients: set[WebSocket] = set()
_clients_lock = asyncio.Lock()


@router.websocket("/ws/demo")
async def demo_ws(websocket: WebSocket):
    await websocket.accept()
    async with _clients_lock:
        _clients.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        async with _clients_lock:
            _clients.discard(websocket)


async def broadcast(event: dict):
    async with _clients_lock:
        snapshot = list(_clients)
    dead: list[WebSocket] = []
    for ws in snapshot:
        try:
            await ws.send_json(event)
        except Exception:
            dead.append(ws)
    for ws in dead:
        async with _clients_lock:
            _clients.discard(ws)


@router.post("/api/demo/trigger-sos")
async def trigger_sos(body: dict):
    device_id = body.get("device_id", "D-1001")
    event = {
        "type": "sos",
        "device_id": device_id,
        "message": f"SOS 紧急告警！设备 {device_id} 触发紧急求助！",
    }
    await broadcast(event)
    async with _clients_lock:
        client_count = len(_clients)
    return {"code": 0, "msg": "SOS triggered", "clients": client_count}
