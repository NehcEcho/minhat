from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    token: str
    username: str

class ResponseBase(BaseModel):
    code: int
    msg: str

class UserInfo(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    phone: Optional[str] = None
    enable: bool
    company_id: int
    company_name: Optional[str] = None
    company_admin_username: Optional[str] = None
    role: Optional[dict] = None

class UserInfoResponse(ResponseBase):
    data: Optional[UserInfo] = None

class PasswordChange(BaseModel):
    password: str

class DeviceBase(BaseModel):
    id: int
    device_id: str
    device_name: str
    product_id: int
    product_code: Optional[str] = None
    product_name: Optional[str] = None
    protocol: Optional[List[str]] = None
    longitude: Optional[str] = None
    latitude: Optional[str] = None
    latest_data: Optional[dict] = None
    status: Optional[str] = "Offline"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class DeviceDetail(DeviceBase):
    company_id: Optional[int] = None
    company_name: Optional[str] = None

class DeviceGroup(BaseModel):
    id: int
    group_name: str
    devices: Optional[List[DeviceBase]] = None

class UserDevicesResponse(ResponseBase):
    data: Optional[dict] = None

class DeviceListData(BaseModel):
    page_index: int
    page_size: int
    page_count: int
    total: int
    items: List[DeviceDetail]

class DeviceListResponse(ResponseBase):
    data: Optional[DeviceListData] = None

class DeviceDetailResponse(ResponseBase):
    data: Optional[DeviceDetail] = None

class DeviceUpdate(BaseModel):
    device_name: Optional[str] = None
    product_id: Optional[int] = None

class DeviceFileItem(BaseModel):
    name: str
    path: str
    last_modified: Optional[str] = None
    size: Optional[int] = None
    presigned_url: Optional[str] = None

class DeviceFileResponse(ResponseBase):
    data: Optional[dict] = None

class FileDeleteRequest(BaseModel):
    path: str

class EmployeeBase(BaseModel):
    id: int
    employee_no: str
    name: str
    gender: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    id_number: Optional[str] = None
    status: Optional[str] = "in_service"
    entry_date: Optional[datetime] = None

class EmployeeDetail(EmployeeBase):
    company_id: Optional[int] = None
    political_status: Optional[str] = None
    marital_status: Optional[str] = None
    education: Optional[str] = None
    updated_at: Optional[datetime] = None

class EmployeeCreate(BaseModel):
    name: str
    employee_no: Optional[str] = None
    gender: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    id_number: Optional[str] = None
    entry_date: Optional[datetime] = None

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None

class EmployeeListData(BaseModel):
    page_index: int
    page_size: int
    page_count: int
    total: int
    items: List[EmployeeBase]

class EmployeeListResponse(ResponseBase):
    data: Optional[EmployeeListData] = None

class EmployeeDetailResponse(ResponseBase):
    data: Optional[EmployeeDetail] = None

class EEGDataItem(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    device_id: Optional[str] = None
    timestamp: datetime
    attention: float
    fatigue: float
    drowsiness: float
    stress: float
    delta: Optional[float] = None
    theta: Optional[float] = None
    alpha: Optional[float] = None
    beta: Optional[float] = None
    gamma: Optional[float] = None
    channel_f3: Optional[float] = None
    channel_f4: Optional[float] = None
    channel_c3: Optional[float] = None
    channel_c4: Optional[float] = None
    channel_p3: Optional[float] = None
    channel_p4: Optional[float] = None
    channel_o1: Optional[float] = None
    channel_o2: Optional[float] = None
    risk_level: Optional[str] = "normal"

class EEGDataResponse(ResponseBase):
    data: Optional[dict] = None

class FenceCreate(BaseModel):
    fence_name: str
    start_time_str: str
    end_time_str: str
    event_type: int
    device_index_ids: List[int]
    fence_shape: str
    circle_fence_data: Optional[dict] = None
    polygon_fence_data: Optional[List[dict]] = None

class FenceUpdate(BaseModel):
    fence_name: Optional[str] = None
    start_time_str: Optional[str] = None
    end_time_str: Optional[str] = None
    update_fence_device: Optional[bool] = False
    device_index_ids: Optional[List[int]] = None
    fence_shape: Optional[str] = None
    circle_fence_data: Optional[dict] = None
    polygon_fence_data: Optional[List[dict]] = None

class FenceDetail(BaseModel):
    id: int
    company_id: int
    fence_name: str
    start_time_str: str
    end_time_str: str
    event_type: int
    device_index_ids: List[int]
    fence_shape: str
    circle_fence_data: Optional[dict] = None
    polygon_fence_data: Optional[List[dict]] = None

class FenceListData(BaseModel):
    page_index: int
    page_size: int
    page_count: int
    total: int
    items: List[FenceDetail]

class FenceListResponse(ResponseBase):
    data: Optional[FenceListData] = None

class InspectionTaskBase(BaseModel):
    id: int
    task_name: str
    shift: Optional[str] = None
    area: Optional[str] = None
    route_name: Optional[str] = None
    assignee_name: Optional[str] = None
    status: Optional[str] = "pending"
    compliance_rate: Optional[float] = None
    total_points: int = 0
    completed_points: int = 0
    abnormalities: int = 0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class InspectionTaskListData(BaseModel):
    page_index: int
    page_size: int
    page_count: int
    total: int
    items: List[InspectionTaskBase]

class InspectionTaskListResponse(ResponseBase):
    data: Optional[InspectionTaskListData] = None

class AlarmBase(BaseModel):
    id: int
    alarm_level: Optional[str] = None
    alarm_type: Optional[str] = None
    device_id: Optional[str] = None
    device_name: Optional[str] = None
    employee_name: Optional[str] = None
    location: Optional[str] = None
    area: Optional[str] = None
    status: Optional[str] = "pending"
    duration: Optional[int] = None
    description: Optional[str] = None
    operator: Optional[str] = None
    triggered_at: Optional[datetime] = None
    disposed_at: Optional[datetime] = None

class AlarmListData(BaseModel):
    page_index: int
    page_size: int
    page_count: int
    total: int
    items: List[AlarmBase]

class AlarmListResponse(ResponseBase):
    data: Optional[AlarmListData] = None

class AlarmUpdate(BaseModel):
    status: Optional[str] = None
    operator: Optional[str] = None
    description: Optional[str] = None
    handled: Optional[bool] = None
    remark: Optional[str] = None
    level: Optional[str] = None

class DashboardStats(BaseModel):
    online_personnel: int = 0
    total_personnel: int = 0
    helmet_online_rate: float = 0.0
    helmet_online_count: int = 0
    helmet_total: int = 0
    today_alarms: int = 0
    pending_alarms: int = 0
    device_online_rate: float = 0.0
    total_devices: int = 0
    online_devices: int = 0
    alarm_stats: Optional[dict] = None
    personnel_distribution: Optional[List[dict]] = None
    device_status_list: Optional[List[dict]] = None

class DashboardResponse(ResponseBase):
    data: Optional[DashboardStats] = None
