from pathlib import Path
import os

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

MEDIA_ROOT = BASE_DIR / "storage" / "device-files"


class Settings:
    def __init__(self) -> None:
        self.upstream_base_url = os.getenv("UPSTREAM_BASE_URL", "https://api.znhaas.net:2443").rstrip("/")
        self.livekit_server_url = os.getenv("LIVEKIT_SERVER_URL", "wss://webrtc.znhaas.net")
        self.talk_websocket_base_url = os.getenv("TALK_WS_BASE_URL", "wss://api.znhaas.net:2443")
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        self.gemini_api_url = os.getenv("GEMINI_API_URL", "")
        self.gemini_model = os.getenv("GEMINI_MODEL", "")
        self.request_timeout_seconds = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "20"))
        self.media_root = MEDIA_ROOT


settings = Settings()
