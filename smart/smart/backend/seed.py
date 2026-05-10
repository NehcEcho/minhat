"""Seed database with sample data"""
from datetime import datetime, timedelta
import random

from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.models import models


def seed(db: Session):
    # Companies
    c1 = models.Company(name="辰尧煤矿集团", admin_username=None)
    db.add(c1)
    db.flush()

    # Products
    products = [
        models.Product(product_code="SMART-H01", product_name="智能矿工帽H01"),
        models.Product(product_code="SMART-H02", product_name="智能矿工帽H02-Pro"),
        models.Product(product_code="SMART-C01", product_name="智能摄像头C01"),
        models.Product(product_code="SMART-S01", product_name="环境传感器S01"),
    ]
    db.add_all(products)
    db.flush()

    # Device Groups
    groups = [
        models.DeviceGroup(group_name="井上区域", company_id=c1.id),
        models.DeviceGroup(group_name="井下-运输大巷", company_id=c1.id),
        models.DeviceGroup(group_name="井下-采掘工作面", company_id=c1.id),
        models.DeviceGroup(group_name="井下-通风巷道", company_id=c1.id),
        models.DeviceGroup(group_name="井下-水泵房", company_id=c1.id),
    ]
    db.add_all(groups)
    db.flush()

    # Devices (smart helmets)
    device_names = [
        "运输巷-1号帽", "运输巷-2号帽", "采掘面A-1号帽", "采掘面A-2号帽",
        "采掘面B-1号帽", "通风巷-1号帽", "通风巷-2号帽", "水泵房-1号帽",
        "井上调度-1号帽", "井上巡检-1号帽", "备用-1号帽", "备用-2号帽",
        "摄像头-运输巷入口", "摄像头-采掘面A", "摄像头-水泵房",
    ]
    devices = []
    for i, name in enumerate(device_names):
        is_helmet = "帽" in name
        d = models.Device(
            device_id=f"MHK-{1001 + i}",
            device_name=name,
            product_id=products[0].id if is_helmet else products[2].id,
            company_id=c1.id,
            group_id=groups[(i % 4) + 1].id if i < 12 else groups[0].id,
            protocol=["TCP", "MQTT"],
            longitude=str(106.5 + random.random() * 0.1),
            latitude=str(26.5 + random.random() * 0.1),
            status=random.choice(["Online", "Online", "Online", "Offline"]),
            network_signal=random.randint(2, 4),
            battery=random.randint(30, 100),
            bitrate=f"{random.randint(1, 8)}Mbps",
            storage_status=random.choice(["Normal", "Normal", "Normal", "Warning"]),
        )
        devices.append(d)
    db.add_all(devices)
    db.flush()

    # Employees
    departments = ["安全监察部", "生产部", "技术部", "调度中心", "机电部", "通风部"]
    positions = ["安全工程师", "矿工", "班组长", "调度员", "技术员", "巡检员", "机电工"]
    names = [
        "张伟", "李强", "王磊", "赵敏", "刘洋", "陈静", "周强", "吴涛",
        "郑丽", "钱勇", "孙明", "杨华", "黄建", "许刚", "何平", "吕峰",
        "施杰", "魏红", "蒋波", "沈燕", "韩军", "唐亮", "冯云", "曹鑫",
        "邓超", "彭飞", "曾勇", "萧然", "田雨", "董雷", "潘宁", "袁浩",
    ]
    employees = []
    for i, name in enumerate(names):
        e = models.Employee(
            employee_no=f"{100001 + i}",
            name=name,
            gender=random.choice(["男", "男", "男", "女"]),
            department=random.choice(departments),
            position=random.choice(positions),
            phone=f"138{random.randint(1000, 9999)}{random.randint(1000, 9999)}",
            id_number=f"{random.randint(100000, 999999)}{random.randint(10000000, 99999999)}",
            status=random.choice(["in_service"] * 8 + ["on_leave", "resigned"]),
            company_id=c1.id,
            device_id=devices[i].id if i < len(devices) else None,
            entry_date=datetime(2020, 1, 1) + timedelta(days=random.randint(0, 1500)),
            political_status=random.choice(["党员", "群众"]),
            marital_status=random.choice(["已婚", "未婚"]),
            education=random.choice(["本科", "大专", "高中", "硕士"]),
        )
        employees.append(e)
    db.add_all(employees)
    db.flush()

    # Alarms
    alarm_types = ["电子围栏越界", "安全帽脱落", "SOS求救", "禁入区域闯入", "低电量警告",
                   "通信中断", "超时作业", "环境异常", "跌倒检测"]
    alarm_levels = ["high", "medium", "low"]
    alarm_areas = ["运输大巷K2+430", "采掘工作面A区", "通风巷道3号口", "水泵房", "井上调度区"]
    for i in range(30):
        a = models.Alarm(
            alarm_level=random.choice(alarm_levels),
            alarm_type=random.choice(alarm_types),
            event_type=random.choice([11, 12, 13, 14]),
            device_id=random.choice(devices).device_id,
            device_name=random.choice(devices).device_name,
            employee_id=random.choice(employees).id,
            employee_name=random.choice(employees).name,
            location=random.choice(alarm_areas),
            longitude=str(106.5 + random.random() * 0.1),
            latitude=str(26.5 + random.random() * 0.1),
            area=random.choice(alarm_areas),
            status=random.choice(["pending", "processing", "disposed"]),
            duration=random.randint(1, 120),
            description=f"告警详情描述-{i+1}",
            triggered_at=datetime.utcnow() - timedelta(minutes=random.randint(0, 1440)),
        )
        db.add(a)

    # EEG Data
    for emp in employees[:10]:
        for hour in range(24):
            eeg = models.EEGData(
                employee_id=emp.id,
                device_id=emp.device.device_id if emp.device else f"MHK-{random.randint(1000, 1100)}",
                timestamp=datetime.utcnow() - timedelta(hours=23-hour),
                attention=round(random.uniform(40, 95), 1),
                fatigue=round(random.uniform(10, 80), 1),
                drowsiness=round(random.uniform(5, 60), 1),
                stress=round(random.uniform(10, 70), 1),
                delta=round(random.uniform(10, 40), 1),
                theta=round(random.uniform(5, 25), 1),
                alpha=round(random.uniform(15, 50), 1),
                beta=round(random.uniform(10, 35), 1),
                gamma=round(random.uniform(5, 20), 1),
                channel_f3=round(random.uniform(0, 100), 1),
                channel_f4=round(random.uniform(0, 100), 1),
                channel_c3=round(random.uniform(0, 100), 1),
                channel_c4=round(random.uniform(0, 100), 1),
                channel_p3=round(random.uniform(0, 100), 1),
                channel_p4=round(random.uniform(0, 100), 1),
                channel_o1=round(random.uniform(0, 100), 1),
                channel_o2=round(random.uniform(0, 100), 1),
                risk_level=random.choice(["normal", "normal", "normal", "risk", "severe"]),
            )
            db.add(eeg)

    # Fences
    fence = models.Fence(
        fence_name="采掘面A电子围栏",
        start_time_str="08:00", end_time_str="18:00",
        event_type=11, company_id=c1.id,
        device_index_ids=[d.id for d in devices[:5]],
        fence_shape="Polygon",
        polygon_fence_data=[
            {"longitude": "106.512", "latitude": "26.501"},
            {"longitude": "106.518", "latitude": "26.501"},
            {"longitude": "106.518", "latitude": "26.508"},
            {"longitude": "106.512", "latitude": "26.508"},
        ],
    )
    db.add(fence)

    # Inspection Tasks
    route_points_mine = [
        {"longitude": "106.510", "latitude": "26.500", "name": "入口"},
        {"longitude": "106.512", "latitude": "26.502", "name": "运输大巷"},
        {"longitude": "106.515", "latitude": "26.504", "name": "采掘面A"},
        {"longitude": "106.514", "latitude": "26.506", "name": "通风巷"},
        {"longitude": "106.516", "latitude": "26.508", "name": "水泵房"},
    ]
    for i in range(5):
        task = models.InspectionTask(
            task_name=f"巡检任务-{i+1}",
            shift=random.choice(["早班", "中班", "晚班"]),
            area=random.choice(["采掘工作面A", "运输大巷", "通风巷道", "水泵房"]),
            route_name=f"路线-{chr(65+i)}",
            route_points=route_points_mine,
            assignee_id=random.choice(employees).id,
            status=random.choice(["completed", "in_progress", "pending"]),
            compliance_rate=round(random.uniform(80, 100), 1),
            total_points=5,
            completed_points=random.randint(0, 5),
            abnormalities=random.randint(0, 3),
            started_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48)),
        )
        db.add(task)
        db.flush()
        for j in range(5):
            rec = models.InspectionRecord(
                task_id=task.id, point_name=f"检查点-{j+1}",
                point_order=j + 1,
                status=random.choice(["checked", "checked", "skipped"]),
                longitude=str(106.51 + j * 0.001),
                latitude=str(26.50 + j * 0.002),
                checked_at=task.started_at + timedelta(minutes=j * 15) if task.started_at else None,
                note=f"检查记录-{j+1}",
            )
            db.add(rec)

    # Track points - generate GPS trajectory for first 5 devices
    for dev in devices[:5]:
        base_lon = float(dev.longitude) if dev.longitude else 106.51
        base_lat = float(dev.latitude) if dev.latitude else 26.50
        for t in range(50):
            tp = models.TrackPoint(
                device_id=dev.device_id,
                longitude=str(base_lon + random.uniform(-0.005, 0.005) + t * 0.0003),
                latitude=str(base_lat + random.uniform(-0.003, 0.003) + t * 0.0002),
                altitude=round(800 + random.uniform(-20, 20), 1),
                speed=round(random.uniform(0, 5), 1),
                direction=round(random.uniform(0, 360), 1),
                accuracy=round(random.uniform(1, 5), 1),
                battery=100 - t // 2,
                signal=random.randint(3, 5),
                located_at=datetime.utcnow() - timedelta(minutes=50 - t),
            )
            db.add(tp)

    # Talk groups
    talk_groups = [
        models.TalkGroup(group_name="运输大巷调度组", group_code="TG001", company_id=c1.id,
                         member_device_ids=[d.id for d in devices[:4]], description="运输大巷对讲群组"),
        models.TalkGroup(group_name="采掘面A工作组", group_code="TG002", company_id=c1.id,
                         member_device_ids=[d.id for d in devices[2:6]], description="采掘工作面A对讲群组"),
        models.TalkGroup(group_name="应急救援组", group_code="TG003", company_id=c1.id,
                         member_device_ids=[d.id for d in devices[:2]] + [devices[6].id, devices[8].id],
                         description="应急全呼群组"),
    ]
    db.add_all(talk_groups)

    db.commit()
    print("Seed data created successfully!")


def run_from_main():
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    run_from_main()
