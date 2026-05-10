from __future__ import annotations

import json
import logging
from typing import Any
from urllib import error, request

from ..settings import settings

logger = logging.getLogger(__name__)


def _to_int(val: object) -> int:
    if isinstance(val, (int, float)):
        return int(val)
    try:
        return int(str(val))
    except (ValueError, TypeError):
        return 0


def build_fallback_briefing(
    eeg_metrics: dict[str, Any],
    device_stats: dict[str, Any],
    alarm_stats: dict[str, Any],
) -> str:
    fatigue = _to_int(eeg_metrics.get('fatigue', 0))
    unhandled = _to_int(alarm_stats.get('unhandledAlarms', 0))
    offline = _to_int(device_stats.get('offlineDevices', 0))

    if fatigue > 70 or unhandled > 5:
        level = '危险'
    elif fatigue > 40 or unhandled > 2 or offline > 0:
        level = '警戒'
    else:
        level = '安全'

    return (
        f'Sir，当前安全等级：{level}。'
        f'疲劳指数 {fatigue}，{unhandled} 条未处理告警，'
        f'{offline} 台设备离线。建议立即关注高风险人员状态。'
    )


def generate_briefing(
    eeg_metrics: dict[str, Any],
    device_stats: dict[str, Any],
    alarm_stats: dict[str, Any],
) -> str:
    api_key = settings.gemini_api_key
    api_url = settings.gemini_api_url

    if not api_key or not api_url:
        logger.info('Gemini 未配置，使用公式兜底简报')
        return build_fallback_briefing(eeg_metrics, device_stats, alarm_stats)

    system_prompt = (
        '你是贾维斯，一个服务于矿山安全指挥中心的 AI 助手。'
        '你的职责是根据脑电数据分析和工矿帽平台的实时数据，用简洁、权威、略带科幻感的口吻，'
        '输出一段不超过 120 字的中文安全态势简报。'
        '要求：'
        '1. 首先概括当前整体安全等级（用安全/警戒/危险三个词之一）。'
        '2. 指出关键风险点（如疲劳度偏高、设备离线、未处理告警等）。'
        '3. 给出一句简短的行动建议。'
        '4. 语气像钢铁侠中的贾维斯：冷静、精确、微带幽默。'
    )

    user_prompt = (
        f'当前态势数据：\n'
        f'【脑电分析】专注度={eeg_metrics.get("focus", "N/A")}, '
        f'疲劳度={eeg_metrics.get("fatigue", "N/A")}, '
        f'压力={eeg_metrics.get("stress", "N/A")}, '
        f'放松度={eeg_metrics.get("relaxation", "N/A")}, '
        f'警觉性={eeg_metrics.get("vigilance", "N/A")}\n'
        f'【设备状态】在线={device_stats.get("onlineDevices", "N/A")}, '
        f'离线={device_stats.get("offlineDevices", "N/A")}, '
        f'总数={device_stats.get("totalDevices", "N/A")}\n'
        f'【安全告警】总数={alarm_stats.get("totalAlarms", "N/A")}, '
        f'未处理={alarm_stats.get("unhandledAlarms", "N/A")}, '
        f'紧急={alarm_stats.get("criticalAlarms", "N/A")}\n'
        f'请生成安全态势简报。'
    )

    req_body = {
        'model': settings.gemini_model,
        'max_tokens': 500,
        'temperature': 0.8,
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_prompt},
        ],
    }

    try:
        http_request = request.Request(
            url=api_url,
            data=json.dumps(req_body, ensure_ascii=False).encode('utf-8'),
            method='POST',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}',
            },
        )
        with request.urlopen(http_request, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            choices = data.get('choices', [])
            if choices:
                content = choices[0].get('message', {}).get('content', '')
                if content.strip():
                    return content.strip()
    except Exception as exc:
        logger.warning(f'Gemini API 调用失败: {exc}')

    return build_fallback_briefing(eeg_metrics, device_stats, alarm_stats)
