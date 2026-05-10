from sqlalchemy import (
    Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(200), nullable=False)
    email = Column(String(200))
    phone = Column(String(50))
    enable = Column(Boolean, default=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    company = relationship("Company", back_populates="users")
    role_id = Column(Integer, ForeignKey("roles.id"))
    role = relationship("Role")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    admin_username = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    users = relationship("User", back_populates="company")


class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True)
    role_key = Column(String(100), nullable=False)
    role_name = Column(String(100), nullable=False)
    remark = Column(String(500))


class DeviceGroup(Base):
    __tablename__ = "device_groups"
    id = Column(Integer, primary_key=True, index=True)
    group_name = Column(String(200), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"))
    parent_id = Column(Integer, ForeignKey("device_groups.id"), nullable=True)
    devices = relationship("Device", back_populates="group")


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    product_code = Column(String(100), nullable=False)
    product_name = Column(String(200), nullable=False)


class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), unique=True, index=True, nullable=False)
    device_name = Column(String(200), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"))
    product = relationship("Product")
    company_id = Column(Integer, ForeignKey("companies.id"))
    group_id = Column(Integer, ForeignKey("device_groups.id"))
    group = relationship("DeviceGroup", back_populates="devices")
    protocol = Column(JSON)
    longitude = Column(String(50))
    latitude = Column(String(50))
    status = Column(String(20), default="Offline")
    latest_data = Column(JSON)
    network_signal = Column(Integer)
    battery = Column(Integer)
    bitrate = Column(String(50))
    storage_status = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    employee_no = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    gender = Column(String(10))
    department = Column(String(200))
    position = Column(String(200))
    phone = Column(String(50))
    id_number = Column(String(50))
    status = Column(String(20), default="in_service")
    company_id = Column(Integer, ForeignKey("companies.id"))
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)
    device = relationship("Device")
    entry_date = Column(DateTime)
    political_status = Column(String(50))
    marital_status = Column(String(50))
    education = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Alarm(Base):
    __tablename__ = "alarms"
    id = Column(Integer, primary_key=True, index=True)
    alarm_level = Column(String(20))
    alarm_type = Column(String(100))
    event_type = Column(Integer)
    device_id = Column(String(100))
    device_name = Column(String(200))
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    employee_name = Column(String(100))
    location = Column(String(500))
    longitude = Column(String(50))
    latitude = Column(String(50))
    area = Column(String(200))
    status = Column(String(20), default="pending")
    duration = Column(Integer)
    description = Column(Text)
    operator = Column(String(100))
    triggered_at = Column(DateTime, default=datetime.utcnow)
    disposed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class EEGData(Base):
    __tablename__ = "eeg_data"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    employee = relationship("Employee")
    device_id = Column(String(100))
    timestamp = Column(DateTime, default=datetime.utcnow)
    attention = Column(Float)
    fatigue = Column(Float)
    drowsiness = Column(Float)
    stress = Column(Float)
    delta = Column(Float)
    theta = Column(Float)
    alpha = Column(Float)
    beta = Column(Float)
    gamma = Column(Float)
    channel_f3 = Column(Float)
    channel_f4 = Column(Float)
    channel_c3 = Column(Float)
    channel_c4 = Column(Float)
    channel_p3 = Column(Float)
    channel_p4 = Column(Float)
    channel_o1 = Column(Float)
    channel_o2 = Column(Float)
    risk_level = Column(String(20), default="normal")
    created_at = Column(DateTime, default=datetime.utcnow)


class Fence(Base):
    __tablename__ = "fences"
    id = Column(Integer, primary_key=True, index=True)
    fence_name = Column(String(200), nullable=False)
    start_time_str = Column(String(10))
    end_time_str = Column(String(10))
    event_type = Column(Integer)
    company_id = Column(Integer, ForeignKey("companies.id"))
    device_index_ids = Column(JSON)
    fence_shape = Column(String(20))
    circle_fence_data = Column(JSON, nullable=True)
    polygon_fence_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class InspectionTask(Base):
    __tablename__ = "inspection_tasks"
    id = Column(Integer, primary_key=True, index=True)
    task_name = Column(String(200), nullable=False)
    shift = Column(String(50))
    area = Column(String(200))
    route_name = Column(String(200))
    route_points = Column(JSON)
    assignee_id = Column(Integer, ForeignKey("employees.id"))
    assignee = relationship("Employee")
    status = Column(String(20), default="pending")
    compliance_rate = Column(Float)
    total_points = Column(Integer, default=0)
    completed_points = Column(Integer, default=0)
    abnormalities = Column(Integer, default=0)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class InspectionRecord(Base):
    __tablename__ = "inspection_records"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("inspection_tasks.id"))
    point_name = Column(String(200))
    point_order = Column(Integer)
    status = Column(String(20))
    longitude = Column(String(50))
    latitude = Column(String(50))
    checked_at = Column(DateTime, nullable=True)
    note = Column(Text)
    image_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)


class TrackPoint(Base):
    __tablename__ = "track_points"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    longitude = Column(String(50), nullable=False)
    latitude = Column(String(50), nullable=False)
    altitude = Column(Float, default=0)
    speed = Column(Float, default=0)
    direction = Column(Float, default=0)
    accuracy = Column(Float, default=0)
    battery = Column(Integer, default=100)
    signal = Column(Integer, default=4)
    located_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class TalkGroup(Base):
    __tablename__ = "talk_groups"
    id = Column(Integer, primary_key=True, index=True)
    group_name = Column(String(200), nullable=False)
    group_code = Column(String(100), unique=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    member_device_ids = Column(JSON)
    status = Column(String(20), default="active")
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EegAnalysisRecord(Base):
    __tablename__ = "eeg_analysis_records"
    id = Column(Integer, primary_key=True, index=True)
    result_id = Column(String(50), unique=True, nullable=False)
    employee = Column(String(100), nullable=False)
    model = Column(String(50), nullable=False)
    result = Column(String(20), nullable=False)
    confidence = Column(Integer, default=0)
    trend = Column(String(100))
    device_id = Column(String(100))
    data_file_path = Column(String(500))
    sampling_rate = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DeviceSnapshot(Base):
    __tablename__ = "device_snapshots"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), unique=True, nullable=False)
    group_id = Column(Integer)
    group_name = Column(String(200))
    device_index_id = Column(String(100))
    device_name = Column(String(200))
    company_id = Column(Integer)
    company_name = Column(String(200))
    product_id = Column(Integer)
    product_code = Column(String(100))
    product_name = Column(String(200))
    status = Column(String(20))
    longitude = Column(String(50))
    latitude = Column(String(50))
    latest_data_json = Column(JSON)
    protocols_json = Column(JSON)
    raw_json = Column(JSON)
    source_updated_at = Column(String(50))
    synced_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AlarmSnapshot(Base):
    __tablename__ = "alarm_snapshots"
    id = Column(Integer, primary_key=True, index=True)
    alarm_id = Column(Integer, unique=True, nullable=False)
    company_id = Column(Integer)
    device_index_id = Column(String(100))
    device_id = Column(String(100), index=True)
    device_name = Column(String(200))
    alarm_name = Column(String(200))
    alarm_time = Column(String(50))
    handle_by = Column(String(100))
    handle_at = Column(String(50))
    level = Column(String(20))
    status = Column(String(20))
    event_code = Column(String(50), index=True)
    fence_id = Column(Integer)
    handled = Column(Integer, default=0)
    raw_json = Column(JSON)
    synced_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LocationPoint(Base):
    __tablename__ = "location_points"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), index=True, nullable=False)
    longitude = Column(String(50), nullable=False)
    latitude = Column(String(50), nullable=False)
    recorded_at = Column(Integer)
    level = Column(Integer)
    event_code = Column(String(50))
    nearby_electric_state = Column(String(20))
    raw_json = Column(JSON)
    synced_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
