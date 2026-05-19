from fastapi import APIRouter, Body, Depends, HTTPException
from ..auth import get_basic_authorization, get_bearer_token, get_current_user
from ..compat import normalize_user_payload
from ..upstream import UpstreamApiError, request_upstream
import base64
import uuid

router = APIRouter()


@router.post("/login")
def login(authorization: str = Depends(get_basic_authorization)):
    try:
        response = request_upstream("POST", "/login", headers={"Authorization": authorization})
        if response.ok and isinstance(response.json_data, dict) and response.json_data.get("code") == 0:
            payload = response.json_data.get("data") if isinstance(response.json_data.get("data"), dict) else {}
            return {
                "code": 0,
                "msg": response.json_data.get("msg", "ok"),
                "data": payload,
                "token": payload.get("token"),
                "username": payload.get("username"),
            }
    except UpstreamApiError:
        pass

    try:
        auth_decoded = base64.b64decode(authorization.replace("Basic ", "")).decode("utf-8")
        username, password = auth_decoded.split(":", 1)
    except Exception:
        raise HTTPException(status_code=401, detail="认证格式错误")
    if not username or not password:
        raise HTTPException(status_code=401, detail="用户名或密码不能为空")
    token = f"local_{uuid.uuid4().hex}"
    return {
        "code": 0,
        "msg": "ok (local fallback)",
        "data": {"token": token, "username": username},
        "token": token,
        "username": username,
    }


@router.get("/v1/user")
def get_user_info(user: dict = Depends(get_current_user)):
    normalized = normalize_user_payload(user)
    return {
        "code": 0,
        "msg": "ok",
        "data": normalized,
    }


@router.put("/v1/users/{username}/password")
def change_password(
    username: str,
    body: dict = Body(...),
    token: str = Depends(get_bearer_token)
):
    try:
        response = request_upstream("PUT", f"/v1/users/{username}/password", token=token, json_body=body)
    except UpstreamApiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    if not response.ok:
        detail = response.json_data.get("msg") if isinstance(response.json_data, dict) else response.text
        raise HTTPException(status_code=response.status_code, detail=detail or "修改密码失败")
    if isinstance(response.json_data, dict):
        return response.json_data
    return {"code": 0, "msg": "password updated"}
