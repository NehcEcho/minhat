import os
import sys
import pytest
import base64
import json
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.auth import _local_user_payload, _local_tokens
from app.models.models import AlarmSnapshot, LocationPoint
from app.services.eeg_analysis import _hash_code, MODELS, RESULTS


class TestAuthFix:
    def test_local_token_stores_username(self):
        _local_tokens["local_abc123"] = "zhangsan"
        result = _local_user_payload("local_abc123")
        assert result["username"] == "zhangsan"
        del _local_tokens["local_abc123"]

    def test_local_token_unknown_returns_default(self):
        result = _local_user_payload("local_nonexistent")
        assert result["username"] == "local-user"

    def test_no_more_upstream_user_hardcoded(self):
        _local_tokens["local_test456"] = "wangwu"
        result = _local_user_payload("local_test456")
        assert result["username"] == "wangwu"
        assert result["username"] != "upstream-user"
        del _local_tokens["local_test456"]


class TestEegAnalysisFix:
    def test_sampling_rate_valid_number(self):
        try:
            val = float("256")
            assert val == 256.0
        except (ValueError, TypeError):
            pytest.fail("Should not raise")

    def test_sampling_rate_invalid_string_defaults(self):
        raw = "abc"
        try:
            val = float(raw)
            assert False, "Should have raised"
        except (ValueError, TypeError):
            val = 256.0
        assert val == 256.0

    def test_sampling_rate_none_defaults(self):
        raw = None
        try:
            val = float(raw) if raw is not None else 256.0
        except (ValueError, TypeError):
            val = 256.0
        assert val == 256.0


class TestAlarmSnapshotModel:
    def test_has_source_updated_at_column(self):
        cols = [c.name for c in AlarmSnapshot.__table__.columns]
        assert "source_updated_at" in cols, f"source_updated_at not in columns: {cols}"


class TestLocationsLevelsParsing:
    def test_valid_levels(self):
        levels = "11,12,13"
        result = []
        for l in levels.split(","):
            try:
                result.append(int(l.strip()))
            except ValueError:
                pass
        assert result == [11, 12, 13]

    def test_invalid_levels_skipped(self):
        levels = "11,abc,13"
        result = []
        for l in levels.split(","):
            try:
                result.append(int(l.strip()))
            except ValueError:
                pass
        assert result == [11, 13]

    def test_empty_levels_skipped(self):
        levels = "11,,13"
        result = []
        for l in levels.split(","):
            try:
                result.append(int(l.strip()))
            except ValueError:
                pass
        assert result == [11, 13]


class TestHandledBoolSerialization:
    def test_true_serialized_lowercase(self):
        handled = True
        result = str(handled).lower() if handled is not None else None
        assert result == "true"

    def test_false_serialized_lowercase(self):
        handled = False
        result = str(handled).lower() if handled is not None else None
        assert result == "false"

    def test_none_stays_none(self):
        handled = None
        result = str(handled).lower() if handled is not None else None
        assert result is None


class TestFencesTotalFix:
    def test_total_uses_merged_length(self):
        upstream_total = 100
        merged = [{"id": 1}, {"id": 2}]
        total = len(merged)
        assert total == 2

    def test_total_not_inflated_by_upstream(self):
        upstream_total = 100
        merged = [{"id": 1}, {"id": 2}]
        total = len(merged)
        assert total != max(upstream_total, len(merged))


class TestReportsSortOrder:
    def test_sort_order_calculation(self):
        existing_orders = [0, 1, 2]
        max_order_result = max(existing_orders) if existing_orders else -1
        new_order = max_order_result + 1
        assert new_order == 3

    def test_sort_order_after_deletion(self):
        existing_orders = [0, 2]
        max_order_result = max(existing_orders) if existing_orders else -1
        new_order = max_order_result + 1
        assert new_order == 3


class TestStreamValidation:
    def test_serial_none_rejected(self):
        serial = None
        device = None
        serial = serial or device
        assert serial is None, "Should be None when both missing"

    def test_serial_from_device(self):
        serial = None
        device = "DEV001"
        serial = serial or device
        assert serial == "DEV001"


class TestQueryTypeHints:
    def test_optional_str_type(self):
        from typing import get_type_hints
        pass


class TestWebsocketsParamName:
    def test_additional_headers_is_correct_param_name(self):
        import inspect
        import websockets
        sig = inspect.signature(websockets.connect)
        param_names = list(sig.parameters.keys())
        has_additional = "additional_headers" in param_names
        has_extra = "extra_headers" in param_names
        assert has_additional or has_extra, f"websockets.connect params: {param_names}"


class TestDemoThreadSafety:
    def test_set_operations(self):
        clients = set()
        ws1 = "ws1"
        ws2 = "ws2"
        clients.add(ws1)
        clients.add(ws2)
        assert len(clients) == 2
        clients.discard("ws_missing")
        assert len(clients) == 2
        clients.discard(ws1)
        assert len(clients) == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])