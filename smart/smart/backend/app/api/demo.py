from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json

router = APIRouter()

clients: list[WebSocket] = []


@router.websocket("/ws/demo")
async def demo_ws(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        if websocket in clients:
            clients.remove(websocket)


async def broadcast(event: dict):
    dead: list[WebSocket] = []
    for ws in clients:
        try:
            await ws.send_json(event)
        except Exception:
            dead.append(ws)
    for ws in dead:
        if ws in clients:
            clients.remove(ws)


@router.post("/api/demo/trigger-sos")
async def trigger_sos(body: dict):
    device_id = body.get("device_id", "D-1001")
    event = {
        "type": "sos",
        "device_id": device_id,
        "message": f"SOS 紧急告警！设备 {device_id} 触发紧急求助！",
    }
    await broadcast(event)
    return {"code": 0, "msg": "SOS triggered", "clients": len(clients)}
