from __future__ import annotations

from dataclasses import dataclass
import http.client
import json
import ssl
from typing import Any
from urllib import error, parse, request

from .settings import settings

_SSL_CONTEXT = ssl.create_default_context()
_SSL_CONTEXT.check_hostname = False
_SSL_CONTEXT.verify_mode = ssl.CERT_NONE


@dataclass
class UpstreamResponse:
    status_code: int
    headers: dict[str, str]
    body: bytes
    json_data: Any
    text: str | None

    @property
    def ok(self) -> bool:
        return 200 <= self.status_code < 300


class UpstreamApiError(Exception):
    def __init__(self, message: str, response: UpstreamResponse | None = None) -> None:
        super().__init__(message)
        self.response = response


def _build_url(path: str, params: dict[str, Any] | None = None) -> str:
    normalized_path = path if path.startswith("/") else f"/{path}"
    url = f"{settings.upstream_base_url}{normalized_path}"
    if params:
        query_items: list[tuple[str, str]] = []
        for key, value in params.items():
            if value is None:
                continue
            if isinstance(value, (list, tuple)):
                for item in value:
                    if item is not None:
                        query_items.append((key, str(item)))
            else:
                query_items.append((key, str(value)))
        if query_items:
            url = f"{url}?{parse.urlencode(query_items)}"
    return url


def _normalize_headers(raw_headers: Any) -> dict[str, str]:
    headers: dict[str, str] = {}
    if raw_headers is None:
        return headers
    for key, value in raw_headers.items():
        headers[str(key).lower()] = str(value)
    return headers


def _parse_response(status_code: int, raw_headers: Any, body: bytes) -> UpstreamResponse:
    headers = _normalize_headers(raw_headers)
    text: str | None = None
    json_data: Any = None
    if body:
        try:
            text = body.decode("utf-8")
        except UnicodeDecodeError:
            text = None
    content_type = headers.get("content-type", "")
    if text and ("json" in content_type.lower() or text.strip().startswith("{") or text.strip().startswith("[")):
        try:
            json_data = json.loads(text)
        except json.JSONDecodeError:
            json_data = None
    return UpstreamResponse(
        status_code=status_code,
        headers=headers,
        body=body,
        json_data=json_data,
        text=text,
    )


def request_upstream(
    method: str,
    path: str,
    *,
    token: str | None = None,
    params: dict[str, Any] | None = None,
    json_body: Any = None,
    headers: dict[str, str] | None = None,
) -> UpstreamResponse:
    url = _build_url(path, params)
    request_headers = {
        "Accept": "application/json, text/plain, */*",
    }
    if headers:
        request_headers.update(headers)
    body: bytes | None = None
    if token:
        request_headers["Authorization"] = f"Bearer {token}"
    if json_body is not None:
        body = json.dumps(json_body, ensure_ascii=False).encode("utf-8")
        request_headers["Content-Type"] = "application/json"
    req = request.Request(url=url, data=body, method=method.upper(), headers=request_headers)
    try:
        with request.urlopen(req, timeout=settings.request_timeout_seconds, context=_SSL_CONTEXT) as resp:
            return _parse_response(resp.status, resp.headers, resp.read())
    except error.HTTPError as exc:
        return _parse_response(exc.code, exc.headers, exc.read())
    except (error.URLError, http.client.HTTPException, OSError) as exc:
        reason = getattr(exc, "reason", None) or str(exc)
        raise UpstreamApiError(f"上游接口访问失败: {reason}") from exc


def require_success(response: UpstreamResponse, message: str) -> UpstreamResponse:
    if not response.ok:
        raise UpstreamApiError(message, response)
    return response
