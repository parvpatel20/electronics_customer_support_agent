from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.config import settings
from backend.db.mysql_client import get_connection


def main() -> int:
    print("Testing TiDB Cloud connection")
    print(f"host={settings.MYSQL_HOST}")
    print(f"port={settings.MYSQL_PORT}")
    print(f"user={settings.MYSQL_USER}")
    print(f"database={settings.MYSQL_DATABASE}")
    print(f"ssl_verify_cert={settings.MYSQL_SSL_VERIFY_CERT}")
    print(f"ssl_verify_identity={settings.MYSQL_SSL_VERIFY_IDENTITY}")

    try:
        conn = get_connection(autocommit=True)
        with conn.cursor() as cursor:
            cursor.execute("SELECT DATABASE() AS database_name, VERSION() AS version")
            row = cursor.fetchone()
            cursor.execute("SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema = %s", (settings.MYSQL_DATABASE,))
            table_row = cursor.fetchone()
        conn.close()
    except Exception as exc:
        print(f"Connection failed: {exc}")
        return 1

    print("Connection established.")
    print(f"database_name={row.get('database_name')}")
    print(f"version={row.get('version')}")
    print(f"table_count={table_row.get('table_count')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

