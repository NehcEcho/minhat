from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy.orm import Session

from ..auth import get_bearer_token
from ..database import get_db
from ..services import eeg_analysis

router = APIRouter()


@router.get("/api/eeg-analysis/records")
def get_records(
    keyword: str | None = Query(None),
    model: str | None = Query(None),
    result: str | None = Query(None),
    page_index: int = Query(1, ge=1),
    page_size: int = Query(5, ge=1, le=100),
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db),
):
    return {
        "code": 0,
        "msg": "ok",
        "data": eeg_analysis.query_records(
            db, keyword=keyword, model=model, result=result,
            page_index=page_index, page_size=page_size,
        ),
    }


@router.post("/api/eeg-analysis/tasks")
def create_task(
    body: dict = Body(...),
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db),
):
    employee_id = body.get("employeeId", "")
    device_id = body.get("deviceId", "")
    data_file_path = body.get("dataFilePath", "")
    try:
        sampling_rate = float(body.get("samplingRate", 256))
    except (ValueError, TypeError):
        sampling_rate = 256.0

    record = eeg_analysis.create_task(
        db, employee_id=employee_id, device_id=device_id,
        data_file_path=data_file_path, sampling_rate=sampling_rate,
    )

    return {
        "code": 0,
        "msg": "分析任务已创建",
        "data": {
            "result_id": record.result_id,
            "model": record.model,
            "result": record.result,
            "confidence": record.confidence,
            "trend": record.trend,
        },
    }
