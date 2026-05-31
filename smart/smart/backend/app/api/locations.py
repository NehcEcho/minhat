from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..auth import get_bearer_token
from ..database import get_db
from ..models.models import TrackPoint
from ..upstream import UpstreamApiError, request_upstream

router = APIRouter()


@router.get("/v1/locations")
def get_locations(
    device_id: str = Query(..., alias="device_id"),
    levels: str = Query(None),
    start_time: int = Query(..., alias="start_time"),
    end_time: int = Query(..., alias="end_time"),
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db)
):
    """获取历史轨迹定位数据"""
    from datetime import datetime, timezone
    try:
        response = request_upstream(
            "GET",
            "/v1/locations",
            token=token,
            params={
                "device_id": device_id,
                "levels": levels,
                "start_time": start_time,
                "end_time": end_time,
            },
        )
        if response.ok and isinstance(response.json_data, dict) and isinstance(response.json_data.get("data"), list):
            return response.json_data
    except UpstreamApiError:
        pass
    query = db.query(TrackPoint).filter(TrackPoint.device_id == device_id)
    if start_time:
        st = datetime.fromtimestamp(start_time, tz=timezone.utc)
        query = query.filter(TrackPoint.located_at >= st)
    if end_time:
        et = datetime.fromtimestamp(end_time, tz=timezone.utc)
        query = query.filter(TrackPoint.located_at <= et)
    if levels:
        level_list = []
        for l in levels.split(","):
            try:
                level_list.append(int(l.strip()))
            except ValueError:
                pass
        if level_list:
            query = query.filter(TrackPoint.accuracy.in_(level_list))
    items = query.order_by(TrackPoint.located_at.asc()).limit(2000).all()
    return {
        "code": 0, "msg": "ok",
        "data": [
            {
                "longitude": p.longitude,
                "latitude": p.latitude,
                "altitude": p.altitude,
                "speed": p.speed,
                "direction": p.direction,
                "accuracy": p.accuracy,
                "battery": p.battery,
                "signal": p.signal,
                "located_at": str(p.located_at),
            }
            for p in items
        ]
    }
