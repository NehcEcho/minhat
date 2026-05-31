from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import get_bearer_token
from ..database import get_db
from ..models.models import EEGData, Employee

router = APIRouter()


def _eeg_payload(item: EEGData) -> dict:
    timestamp = str(item.timestamp) if item.timestamp else None
    return {
        "id": item.id,
        "employee_id": item.employee_id,
        "employeeId": item.employee_id,
        "employee_name": item.employee.name if item.employee else None,
        "employeeName": item.employee.name if item.employee else None,
        "device_id": item.device_id,
        "deviceId": item.device_id,
        "timestamp": timestamp,
        "attention": item.attention,
        "fatigue": item.fatigue,
        "drowsiness": item.drowsiness,
        "stress": item.stress,
        "delta": item.delta,
        "theta": item.theta,
        "alpha": item.alpha,
        "beta": item.beta,
        "gamma": item.gamma,
        "channel_f3": item.channel_f3,
        "channel_f4": item.channel_f4,
        "channel_c3": item.channel_c3,
        "channel_c4": item.channel_c4,
        "channel_p3": item.channel_p3,
        "channel_p4": item.channel_p4,
        "channel_o1": item.channel_o1,
        "channel_o2": item.channel_o2,
        "risk_level": item.risk_level,
        "riskLevel": item.risk_level,
    }


def _paginate_payload(items: list[dict], page_index: int, page_size: int, total: int) -> dict:
    page_count = (total + page_size - 1) // page_size if page_size else 1
    return {
        "pageIndex": page_index,
        "page_index": page_index,
        "pageSize": page_size,
        "page_size": page_size,
        "pageCount": page_count,
        "page_count": page_count,
        "total": total,
        "items": items,
    }


@router.get("/v1/eeg/data")
def get_eeg_data_list(
    employee_id: int | None = Query(None),
    page_index: int = Query(1),
    page: int | None = Query(None),
    page_size: int = Query(20),
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db)
):
    del token
    effective_page = page or page_index
    query = db.query(EEGData)
    if employee_id:
        query = query.filter(EEGData.employee_id == employee_id)
    total = query.count()
    items = query.order_by(EEGData.timestamp.desc()).offset((effective_page - 1) * page_size).limit(page_size).all()
    return {"code": 0, "msg": "ok", "data": _paginate_payload([_eeg_payload(item) for item in items], effective_page, page_size, total)}


@router.get("/v1/eeg/stats")
def get_eeg_stats(token: str = Depends(get_bearer_token), db: Session = Depends(get_db)):
    from sqlalchemy import distinct, func

    del token
    total_monitored = db.query(func.count(distinct(EEGData.employee_id))).scalar()
    normal = db.query(func.count(distinct(EEGData.employee_id))).filter(EEGData.risk_level == "normal").scalar()
    risk = db.query(func.count(distinct(EEGData.employee_id))).filter(EEGData.risk_level == "risk").scalar()
    severe = db.query(func.count(distinct(EEGData.employee_id))).filter(EEGData.risk_level == "severe").scalar()
    total_alarms = db.query(EEGData).filter(EEGData.risk_level != "normal").count()
    return {
        "code": 0,
        "msg": "ok",
        "data": {
            "total_monitored": total_monitored or 0,
            "normal": normal or 0,
            "risk": risk or 0,
            "severe_risk": severe or 0,
            "severeRisk": severe or 0,
            "total_alarms": total_alarms or 0,
            "totalAlarms": total_alarms or 0,
        },
    }


@router.get("/v1/eeg/employee/{employee_id}")
def get_employee_eeg(employee_id: int, token: str = Depends(get_bearer_token), db: Session = Depends(get_db)):
    del token
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    latest = db.query(EEGData).filter(EEGData.employee_id == employee_id).order_by(EEGData.timestamp.desc()).first()
    history = db.query(EEGData).filter(EEGData.employee_id == employee_id).order_by(EEGData.timestamp.asc()).limit(100).all()
    return {
        "code": 0,
        "msg": "ok",
        "data": {
            "employee": {
                "id": employee.id,
                "name": employee.name,
                "employee_no": employee.employee_no,
                "employeeNo": employee.employee_no,
                "department": employee.department,
                "position": employee.position,
            },
            "latest": {
                "attention": latest.attention if latest else 0,
                "fatigue": latest.fatigue if latest else 0,
                "drowsiness": latest.drowsiness if latest else 0,
                "stress": latest.stress if latest else 0,
                "risk_level": latest.risk_level if latest else "normal",
                "riskLevel": latest.risk_level if latest else "normal",
            } if latest else None,
            "history": [_eeg_payload(item) for item in history],
        },
    }
