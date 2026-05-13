from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, SessionLocal, engine
from .models import models
from .api import (auth, dashboard, devices, employees, alarms, eeg,
                   fences, inspections, locations, talkgroups,
                   stream, playback, rtc, livekit,
                   eeg_analysis, intelligence, platform_cache,
                   system, talk_relay, demo, reports)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Helmet Management System", version="1.0.0")

@app.on_event("startup")
def cleanup_local_auth_tables() -> None:
    db = SessionLocal()
    try:
        db.query(models.User).delete()
        db.query(models.Role).delete()
        for company in db.query(models.Company).all():
            company.admin_username = None
        db.commit()
    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, tags=["Auth"])
app.include_router(dashboard.router, tags=["Dashboard"])
app.include_router(devices.router, tags=["Devices"])
app.include_router(employees.router, tags=["Employees"])
app.include_router(alarms.router, tags=["Alarms"])
app.include_router(eeg.router, tags=["EEG"])
app.include_router(fences.router, tags=["Fences"])
app.include_router(inspections.router, tags=["Inspections"])
app.include_router(locations.router, tags=["Locations"])
app.include_router(talkgroups.router, tags=["TalkGroups"])
app.include_router(stream.router, tags=["Stream"])
app.include_router(playback.router, tags=["Playback"])
app.include_router(rtc.router, tags=["RTC"])
app.include_router(livekit.router, tags=["LiveKit"])
app.include_router(eeg_analysis.router, tags=["EEG Analysis"])
app.include_router(intelligence.router, tags=["Intelligence"])
app.include_router(platform_cache.router, tags=["Platform Cache"])
app.include_router(system.router, tags=["System"])
app.include_router(demo.router, tags=["Demo"])
app.include_router(reports.router, tags=["Reports"])

@app.websocket("/ws/talk-relay")
async def ws_talk_relay(websocket: WebSocket):
    await talk_relay.talk_relay_handler(websocket)

@app.get("/")
def root():
    return {"code": 0, "msg": "Smart Helmet API v1.0"}
