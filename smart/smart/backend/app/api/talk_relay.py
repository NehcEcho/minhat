import asyncio
import json
import logging
from urllib.parse import parse_qs, urlparse

import websockets
from fastapi import WebSocket, WebSocketDisconnect

from ..settings import settings

logger = logging.getLogger(__name__)


async def talk_relay_handler(websocket: WebSocket) -> None:
    await websocket.accept()
    upstream_ws = None

    try:
        query_string = str(websocket.url).split("?", 1)[1] if "?" in str(websocket.url) else ""
        params = parse_qs(query_string)
        serial = (params.get("serial", [None])[0] or "").strip()
        code = (params.get("code", [serial])[0] or "").strip()
        token = (params.get("token", [""])[0] or "").strip()
        fmt = (params.get("format", ["pcm"])[0] or "pcm").strip()

        if not serial:
            path_segments = str(websocket.url).rstrip("/").split("/")
            for i, seg in enumerate(path_segments):
                if seg in ("ws-talk", "ws-talk-relay") and i + 2 < len(path_segments):
                    serial = path_segments[i + 1]
                    code = path_segments[i + 2]
                    break

        if not serial:
            await websocket.close(code=4000, reason="缺少 serial 参数")
            return

        upstream_url = f"{settings.talk_websocket_base_url}/api/v1/control/ws-talk/{serial}/{code}"
        upstream_headers = {"Authorization": f"Bearer {token}"} if token else {}

        upstream_ws = await websockets.connect(upstream_url, extra_headers=upstream_headers)

        async def client_to_upstream():
            try:
                while True:
                    data = await websocket.receive()
                    if "text" in data:
                        await upstream_ws.send(data["text"])
                    elif "bytes" in data:
                        await upstream_ws.send(data["bytes"])
            except (WebSocketDisconnect, websockets.ConnectionClosed, Exception):
                pass

        async def upstream_to_client():
            try:
                while True:
                    data = await upstream_ws.recv()
                    if isinstance(data, bytes):
                        await websocket.send_bytes(data)
                    else:
                        await websocket.send_text(data)
            except (websockets.ConnectionClosed, Exception):
                pass

        await asyncio.gather(client_to_upstream(), upstream_to_client())

    except websockets.exceptions.InvalidURI as e:
        logger.warning(f"WebSocket 上游连接失败: {e}")
        await websocket.close(code=4001, reason="上游连接失败")
    except Exception as e:
        logger.error(f"Talk relay 异常: {e}")
    finally:
        if upstream_ws and not upstream_ws.closed:
            await upstream_ws.close()
        try:
            await websocket.close()
        except Exception:
            pass
