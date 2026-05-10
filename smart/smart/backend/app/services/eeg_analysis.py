from __future__ import annotations

import hashlib
import random
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from ..models.models import EegAnalysisRecord

MODELS = ["疲劳识别", "姿态识别", "生命体征模型", "佩戴识别"]
RESULTS = ["正常", "关注", "高风险"]
TRENDS = [
    "近 30 分钟上升",
    "连续异常 3 次",
    "波动平稳",
    "需人工复核",
    "夜班后持续走高",
    "无显著异常",
    "区间偏离",
]


def _hash_code(*args: str) -> int:
    return int(hashlib.md5("".join(args).encode()).hexdigest(), 16)


def _build_result_id() -> str:
    return f"AN-{random.randint(100000, 999999)}"


def create_task(
    db: Session,
    employee_id: str,
    device_id: str,
    data_file_path: str,
    sampling_rate: float,
) -> EegAnalysisRecord:
    model_index = _hash_code(employee_id, device_id) % len(MODELS)
    model = MODELS[model_index]

    score = sampling_rate + abs(_hash_code(device_id, model) % 100)
    if score >= 140:
        result = "高风险"
        base_conf = 92
    elif score >= 90:
        result = "关注"
        base_conf = 85
    else:
        result = "正常"
        base_conf = 80

    confidence = min(99, base_conf + abs(_hash_code(employee_id) % 6))

    if result == "高风险":
        trend = "连续异常 3 次"
    elif result == "关注":
        trend = TRENDS[abs(_hash_code(data_file_path) % len(TRENDS))]
    else:
        trend = "无显著异常"

    now = datetime.now(timezone.utc).isoformat()
    record = EegAnalysisRecord(
        result_id=_build_result_id(),
        employee=employee_id,
        model=model,
        result=result,
        confidence=confidence,
        trend=trend,
        device_id=device_id,
        data_file_path=data_file_path,
        sampling_rate=sampling_rate,
        created_at=now,
        updated_at=now,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def query_records(
    db: Session,
    keyword: str | None = None,
    model: str | None = None,
    result: str | None = None,
    page_index: int = 1,
    page_size: int = 5,
) -> dict[str, Any]:
    query = db.query(EegAnalysisRecord)
    if keyword:
        kw = f"%{keyword}%"
        query = query.filter(
            EegAnalysisRecord.result_id.like(kw)
            | EegAnalysisRecord.employee.like(kw)
            | EegAnalysisRecord.trend.like(kw)
            | EegAnalysisRecord.device_id.like(kw)
        )
    if model:
        query = query.filter(EegAnalysisRecord.model == model)
    if result:
        query = query.filter(EegAnalysisRecord.result == result)

    total = query.count()
    items = (
        query.order_by(EegAnalysisRecord.created_at.desc())
        .offset((page_index - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "pageIndex": page_index,
        "pageSize": page_size,
        "pageCount": (total + page_size - 1) // page_size if page_size else 1,
        "total": total,
        "items": [
            {
                "id": r.id,
                "result_id": r.result_id,
                "employee": r.employee,
                "model": r.model,
                "result": r.result,
                "confidence": r.confidence,
                "trend": r.trend,
                "device_id": r.device_id,
                "data_file_path": r.data_file_path,
                "sampling_rate": r.sampling_rate,
                "created_at": r.created_at,
                "updated_at": r.updated_at,
            }
            for r in items
        ],
    }
