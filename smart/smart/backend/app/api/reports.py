from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
import os, uuid, shutil

from ..database import SessionLocal
from ..models.models import WorkReport, ReportImage

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "storage", "report-images")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/reports")
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(WorkReport).order_by(WorkReport.created_at.desc()).all()
    return {"code": 0, "data": [
        {
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "location": r.location,
            "worker_name": r.worker_name,
            "status": r.status,
            "image_count": len(r.images),
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        }
        for r in reports
    ]}


@router.get("/reports/{report_id}")
def get_report(report_id: int, db: Session = Depends(get_db)):
    r = db.query(WorkReport).filter(WorkReport.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")
    return {
        "code": 0,
        "data": {
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "location": r.location,
            "worker_name": r.worker_name,
            "status": r.status,
            "images": [{
                "id": img.id,
                "filename": img.filename,
                "annotations": img.annotations or [],
                "sort_order": img.sort_order,
                "url": f"/api/reports/images/{img.id}",
            } for img in sorted(r.images, key=lambda x: x.sort_order)],
            "created_at": r.created_at.isoformat() if r.created_at else None,
        },
    }


@router.post("/reports")
def create_report(
    title: str = Form(...),
    description: str = Form(""),
    location: str = Form(""),
    worker_name: str = Form(""),
    db: Session = Depends(get_db),
):
    report = WorkReport(
        title=title,
        description=description,
        location=location,
        worker_name=worker_name,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return {"code": 0, "data": {"id": report.id}}


@router.put("/reports/{report_id}")
def update_report(
    report_id: int,
    title: str = Form(None),
    description: str = Form(None),
    location: str = Form(None),
    worker_name: str = Form(None),
    status: str = Form(None),
    db: Session = Depends(get_db),
):
    r = db.query(WorkReport).filter(WorkReport.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")
    if title is not None:
        r.title = title
    if description is not None:
        r.description = description
    if location is not None:
        r.location = location
    if worker_name is not None:
        r.worker_name = worker_name
    if status is not None:
        r.status = status
    r.updated_at = datetime.utcnow()
    db.commit()
    return {"code": 0, "msg": "updated"}


@router.delete("/reports/{report_id}")
def delete_report(report_id: int, db: Session = Depends(get_db)):
    r = db.query(WorkReport).filter(WorkReport.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")
    for img in r.images:
        file_path = os.path.join(UPLOAD_DIR, img.filename)
        if os.path.isfile(file_path):
            os.remove(file_path)
    db.delete(r)
    db.commit()
    return {"code": 0, "msg": "deleted"}


@router.post("/reports/{report_id}/images")
def upload_image(
    report_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    r = db.query(WorkReport).filter(WorkReport.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")

    ext = os.path.splitext(file.filename or "img.jpg")[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Invalid file type: {ext}")

    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    max_order = db.query(ReportImage).filter(ReportImage.report_id == report_id).count()
    img = ReportImage(
        report_id=report_id,
        filename=unique_name,
        sort_order=max_order,
    )
    db.add(img)
    db.commit()
    db.refresh(img)
    return {"code": 0, "data": {"id": img.id, "filename": img.filename, "url": f"/api/reports/images/{img.id}"}}


@router.get("/reports/images/{image_id}")
def serve_image(image_id: int, db: Session = Depends(get_db)):
    img = db.query(ReportImage).filter(ReportImage.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    file_path = os.path.join(UPLOAD_DIR, img.filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File missing")
    return FileResponse(file_path)


@router.put("/reports/images/{image_id}/annotations")
def save_annotations(
    image_id: int,
    data: dict,
    db: Session = Depends(get_db),
):
    img = db.query(ReportImage).filter(ReportImage.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    annotations = data.get("annotations", [])
    img.annotations = annotations
    db.commit()
    return {"code": 0, "msg": "saved"}


@router.delete("/reports/images/{image_id}")
def delete_image(image_id: int, db: Session = Depends(get_db)):
    img = db.query(ReportImage).filter(ReportImage.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    file_path = os.path.join(UPLOAD_DIR, img.filename)
    if os.path.isfile(file_path):
        os.remove(file_path)
    db.delete(img)
    db.commit()
    return {"code": 0, "msg": "deleted"}
