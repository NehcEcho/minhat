from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from ..auth import get_bearer_token
from ..database import get_db
from ..models.models import Employee, Alarm, Device

router = APIRouter()


@router.get("/v1/dashboard/stats")
def get_dashboard_stats(token: str = Depends(get_bearer_token), db: Session = Depends(get_db)):
    del token
    total_personnel = db.query(Employee).count()
    online_personnel = db.query(Employee).filter(Employee.status == "in_service").count()
    total_devices = db.query(Device).count()
    online_devices = db.query(Device).filter(func.lower(Device.status) == "online").count()
    device_online_rate = round(online_devices / total_devices * 100, 1) if total_devices else 0
    helmet_online_rate = device_online_rate

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_alarms = db.query(Alarm).filter(Alarm.triggered_at >= today_start).count()
    pending_alarms = db.query(Alarm).filter(Alarm.status == "pending").count()
    alarm_disposed = db.query(Alarm).filter(Alarm.status == "disposed").count()
    alarm_processing = db.query(Alarm).filter(Alarm.status == "processing").count()

    dept_dist = db.query(
        Employee.department, func.count(Employee.id)
    ).group_by(Employee.department).all()
    personnel_distribution = [
        {"area": d[0] or "未分配", "count": d[1]} for d in dept_dist
    ]

    devices = db.query(Device).options(joinedload(Device.product)).limit(10).all()
    device_list = [
        {
            "id": d.id,
            "device_name": d.device_name,
            "product_name": d.product.product_name if d.product else "",
            "status": d.status,
            "battery": d.battery or 0,
            "network_signal": d.network_signal or 0,
        }
        for d in devices
    ]

    return {
        "code": 0,
        "msg": "ok",
        "data": {
            "online_personnel": online_personnel,
            "onlinePersonnel": online_personnel,
            "total_personnel": total_personnel,
            "totalPersonnel": total_personnel,
            "helmet_online_rate": helmet_online_rate,
            "helmetOnlineRate": helmet_online_rate,
            "helmet_online_count": online_devices,
            "helmetOnlineCount": online_devices,
            "helmet_total": total_devices,
            "helmetTotal": total_devices,
            "today_alarms": today_alarms,
            "todayAlarms": today_alarms,
            "pending_alarms": pending_alarms,
            "pendingAlarms": pending_alarms,
            "device_online_rate": device_online_rate,
            "deviceOnlineRate": device_online_rate,
            "total_devices": total_devices,
            "totalDevices": total_devices,
            "online_devices": online_devices,
            "onlineDevices": online_devices,
            "alarm_stats": {
                "total": today_alarms,
                "pending": pending_alarms,
                "processing": alarm_processing,
                "disposed": alarm_disposed,
            },
            "alarmStats": {
                "total": today_alarms,
                "pending": pending_alarms,
                "processing": alarm_processing,
                "disposed": alarm_disposed,
            },
            "personnel_distribution": personnel_distribution,
            "personnelDistribution": personnel_distribution,
            "device_status_list": device_list,
            "deviceStatusList": device_list,
        }
    }
