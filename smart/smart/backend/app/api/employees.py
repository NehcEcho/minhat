from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import get_bearer_token
from ..database import get_db
from ..models.models import Employee
from ..schemas.schemas import EmployeeCreate, EmployeeUpdate

router = APIRouter()


def _employee_payload(employee: Employee) -> dict:
    entry_date = str(employee.entry_date) if employee.entry_date else None
    updated_at = str(employee.updated_at) if employee.updated_at else None
    return {
        "id": employee.id,
        "employee_no": employee.employee_no,
        "employeeNo": employee.employee_no,
        "name": employee.name,
        "gender": employee.gender,
        "department": employee.department,
        "position": employee.position,
        "phone": employee.phone,
        "id_number": employee.id_number,
        "idNumber": employee.id_number,
        "status": employee.status,
        "company_id": employee.company_id,
        "political_status": employee.political_status,
        "marital_status": employee.marital_status,
        "education": employee.education,
        "entry_date": entry_date,
        "entryDate": entry_date,
        "updated_at": updated_at,
        "updatedAt": updated_at,
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


@router.get("/v1/employees")
def get_employee_list(
    is_page: bool = Query(True),
    page_index: int = Query(1),
    page: int | None = Query(None),
    page_size: int = Query(20),
    name: str = Query(None),
    department: str = Query(None),
    status: str = Query(None),
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db)
):
    del token
    effective_page = page or page_index
    query = db.query(Employee)
    if name:
        query = query.filter(Employee.name.like(f"%{name}%"))
    if department:
        query = query.filter(Employee.department == department)
    if status:
        query = query.filter(Employee.status == status)
    total = query.count()
    items = query.offset((effective_page - 1) * page_size).limit(page_size).all() if is_page else query.all()
    return {"code": 0, "msg": "ok", "data": _paginate_payload([_employee_payload(employee) for employee in items], effective_page, page_size, total)}


@router.get("/v1/employees/{id:int}")
def get_employee(id: int, token: str = Depends(get_bearer_token), db: Session = Depends(get_db)):
    del token
    employee = db.query(Employee).filter(Employee.id == id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"code": 0, "msg": "ok", "data": _employee_payload(employee)}


@router.post("/v1/employees")
def create_employee(body: EmployeeCreate, token: str = Depends(get_bearer_token), db: Session = Depends(get_db)):
    import random

    del token
    employee = Employee(
        employee_no=body.employee_no or f"EMP{random.randint(10000, 99999)}",
        name=body.name,
        gender=body.gender,
        department=body.department,
        position=body.position,
        phone=body.phone,
        id_number=body.id_number,
        entry_date=body.entry_date,
        company_id=1,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return {"code": 0, "msg": "employee created", "data": employee.id}


@router.put("/v1/employees/{id}")
def update_employee(id: int, body: EmployeeUpdate, token: str = Depends(get_bearer_token), db: Session = Depends(get_db)):
    del token
    employee = db.query(Employee).filter(Employee.id == id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if body.name is not None:
        employee.name = body.name
    if body.gender is not None:
        employee.gender = body.gender
    if body.department is not None:
        employee.department = body.department
    if body.position is not None:
        employee.position = body.position
    if body.phone is not None:
        employee.phone = body.phone
    if body.status is not None:
        employee.status = body.status
    db.commit()
    return {"code": 0, "msg": "employee updated"}


@router.get("/v1/employees/stats")
def get_employee_stats(token: str = Depends(get_bearer_token), db: Session = Depends(get_db)):
    del token
    total = db.query(Employee).count()
    in_service = db.query(Employee).filter(Employee.status == "in_service").count()
    on_leave = db.query(Employee).filter(Employee.status == "on_leave").count()
    resigned = db.query(Employee).filter(Employee.status == "resigned").count()
    return {
        "code": 0,
        "msg": "ok",
        "data": {
            "total": total,
            "in_service": in_service,
            "on_leave": on_leave,
            "resigned": resigned,
        },
    }
