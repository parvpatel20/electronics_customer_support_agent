from __future__ import annotations

import json
from datetime import date, datetime
from decimal import Decimal
from typing import Any


def to_json(data: Any) -> str:
    def default(value: Any) -> str:
        if isinstance(value, (datetime, date)):
            return value.isoformat()
        if isinstance(value, Decimal):
            return str(value)
        return str(value)

    return json.dumps(data, default=default, indent=2, sort_keys=True)


def error(message: str) -> str:
    return to_json({"ok": False, "error": message})

