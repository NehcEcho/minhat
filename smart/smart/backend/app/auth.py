from __future__ import annotations

from fastapi import Depends, Header, HTTPException

from .compat import normalize_user_payload
from .upstream import UpstreamApiError, request_upstream


def _local_user_payload(token: str) -> dict:
    username = "upstream-user"
    if token.strip():
        username = "upstream-user"
    return normalize_user_payload(
        {
            "id": 1,
            "username": username,
            "nickname": "上游用户",
            "name": "上游用户",
            "role": "user",
            "role_key": "user",
            "company_id": 1,
            "companyId": 1,
            "enable": True,
            "enabled": True,
        }
    )


def get_bearer_token(authorization: str | None = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    scheme, _, value = authorization.partition(" ")
    if scheme.lower() != "bearer" or not value.strip():
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    return value.strip()

def get_basic_authorization(authorization: str | None = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    scheme, _, value = authorization.partition(" ")
    if scheme.lower() != "basic" or not value.strip():
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    return authorization

def get_current_user(token: str = Depends(get_bearer_token)) -> dict:
    try:
        response = request_upstream("GET", "/v1/user", token=token)
    except UpstreamApiError:
        return _local_user_payload(token)
    if response.status_code == 401:
        raise HTTPException(status_code=401, detail="Invalid token")
    if response.status_code == 403:
        raise HTTPException(status_code=403, detail="User disabled")
    if not response.ok or not isinstance(response.json_data, dict):
        return _local_user_payload(token)
    payload = response.json_data.get("data") if isinstance(response.json_data.get("data"), dict) else response.json_data
    if not isinstance(payload, dict):
        return _local_user_payload(token)
    return normalize_user_payload(payload)
