from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import get_bearer_token
from ..database import get_db
from ..models.models import InspectionRecord, InspectionTask

router = APIRouter()


def _task_payload(task: InspectionTask) -> dict:
    started_at = str(task.started_at) if task.started_at else None
    completed_at = str(task.completed_at) if task.completed_at else None
    return {
        "id": task.id,
        "task_name": task.task_name,
        "taskName": task.task_name,
        "shift": task.shift,
        "area": task.area,
        "route_name": task.route_name,
        "routeName": task.route_name,
        "route_points": task.route_points,
        "routePoints": task.route_points,
        "assignee_name": task.assignee.name if task.assignee else None,
        "assigneeName": task.assignee.name if task.assignee else None,
        "status": task.status,
        "compliance_rate": task.compliance_rate,
        "complianceRate": task.compliance_rate,
        "total_points": task.total_points,
        "totalPoints": task.total_points,
        "completed_points": task.completed_points,
        "completedPoints": task.completed_points,
        "abnormalities": task.abnormalities,
        "started_at": started_at,
        "startedAt": started_at,
        "completed_at": completed_at,
        "completedAt": completed_at,
    }


def _record_payload(record: InspectionRecord) -> dict:
    checked_at = str(record.checked_at) if record.checked_at else None
    return {
        "id": record.id,
        "point_name": record.point_name,
        "pointName": record.point_name,
        "point_order": record.point_order,
        "pointOrder": record.point_order,
        "status": record.status,
        "longitude": record.longitude,
        "latitude": record.latitude,
        "checked_at": checked_at,
        "checkedAt": checked_at,
        "note": record.note,
        "image_url": record.image_url,
        "imageUrl": record.image_url,
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


@router.get("/v1/inspections")
def get_inspection_list(
    is_page: bool = Query(True),
    page_index: int = Query(1),
    page: int | None = Query(None),
    page_size: int = Query(20),
    status: str = Query(None),
    area: str = Query(None),
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db)
):
    del token
    effective_page = page or page_index
    query = db.query(InspectionTask)
    if status:
        query = query.filter(InspectionTask.status == status)
    if area:
        query = query.filter(InspectionTask.area == area)
    total = query.count()
    items = query.offset((effective_page - 1) * page_size).limit(page_size).all() if is_page else query.all()
    return {"code": 0, "msg": "ok", "data": _paginate_payload([_task_payload(item) for item in items], effective_page, page_size, total)}


@router.get("/v1/inspections/stats")
def get_inspection_stats(token: str = Depends(get_bearer_token), db: Session = Depends(get_db)):
    from sqlalchemy import func

    del token
    total = db.query(InspectionTask).count()
    completed = db.query(InspectionTask).filter(InspectionTask.status == "completed").count()
    in_progress = db.query(InspectionTask).filter(InspectionTask.status == "in_progress").count()
    pending = db.query(InspectionTask).filter(InspectionTask.status == "pending").count()
    abnormal = db.query(InspectionTask).filter(InspectionTask.status == "abnormal").count()
    overdue = db.query(InspectionTask).filter(InspectionTask.status == "overdue").count()
    avg_compliance = db.query(func.avg(InspectionTask.compliance_rate)).scalar() or 0
    return {
        "code": 0,
        "msg": "ok",
        "data": {
            "total": total,
            "completed": completed,
            "in_progress": in_progress,
            "inProgress": in_progress,
            "pending": pending,
            "abnormal": abnormal,
            "overdue": overdue,
            "avg_compliance": round(avg_compliance, 1),
            "avgCompliance": round(avg_compliance, 1),
        },
    }


@router.get("/v1/inspections/{id}")
def get_inspection(id: int, token: str = Depends(get_bearer_token), db: Session = Depends(get_db)):
    del token
    task = db.query(InspectionTask).filter(InspectionTask.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    records = db.query(InspectionRecord).filter(InspectionRecord.task_id == id).order_by(InspectionRecord.point_order).all()
    return {"code": 0, "msg": "ok", "data": {"task": _task_payload(task), "records": [_record_payload(record) for record in records]}}
