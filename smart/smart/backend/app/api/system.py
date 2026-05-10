from fastapi import APIRouter

router = APIRouter()


@router.get("/api/system/health")
def health_check():
    from datetime import datetime, timezone
    return {
        "code": 0,
        "msg": "系统运行正常",
        "data": {
            "service": "backend-python",
            "status": "UP",
            "time": datetime.now(timezone.utc).isoformat(),
        },
    }
