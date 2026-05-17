from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.db.mysql_client import get_connection


def split_sql(sql: str) -> list[str]:
    cleaned_lines = []
    for line in sql.splitlines():
        stripped = line.strip()
        if stripped.startswith("--") or not stripped:
            continue
        cleaned_lines.append(line)
    cleaned = "\n".join(cleaned_lines)
    return [statement.strip() for statement in re.split(r";\s*(?:\n|$)", cleaned) if statement.strip()]


def main() -> int:
    schema_path = ROOT / "backend" / "db" / "schema.sql"
    statements = split_sql(schema_path.read_text(encoding="utf-8"))
    print(f"Applying {len(statements)} SQL statements from {schema_path}")

    try:
        conn = get_connection(autocommit=False)
        with conn.cursor() as cursor:
            for statement in statements:
                cursor.execute(statement)
        conn.commit()
        conn.close()
    except Exception as exc:
        print(f"Schema initialization failed: {exc}")
        return 1

    print("Schema initialization completed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

