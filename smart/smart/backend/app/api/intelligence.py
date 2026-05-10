from fastapi import APIRouter, Body, Depends

from ..auth import get_bearer_token
from ..services import intelligence

router = APIRouter()


@router.post("/api/intelligence/briefing")
def generate_briefing(
    body: dict = Body(...),
    token: str = Depends(get_bearer_token),
):
    eeg_metrics = body.get("eegMetrics", {}) or {}
    device_stats = body.get("deviceStats", {}) or {}
    alarm_stats = body.get("alarmStats", {}) or {}

    briefing = intelligence.generate_briefing(eeg_metrics, device_stats, alarm_stats)

    return {
        "code": 0,
        "msg": "ok",
        "data": {"briefing": briefing},
    }


@router.get("/api/intelligence/status")
def get_status(token: str = Depends(get_bearer_token)):
    from ..settings import settings
    return {
        "code": 0,
        "msg": "ok",
        "data": {
            "service": "Jarvis在线",
            "model": settings.gemini_model or "本地公式兜底",
        },
    }
