"""Clear all conversations, messages, and LangGraph checkpoints.

This gives every visitor a fresh chat experience. Demo data (customers,
orders, invoices, returns, products) is preserved.

Run from the repo root:
    .venv313/bin/python scripts/clear_conversations.py

Or inside Docker:
    docker compose exec backend python3 scripts/clear_conversations.py
"""
from __future__ import annotations

import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.config import settings  # noqa: E402
from backend.db.mysql_client import get_connection  # noqa: E402
from backend.logging_config import configure_logging  # noqa: E402

configure_logging()


def clear_mysql() -> None:
    conn = get_connection(autocommit=False)
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM messages")
            print(f"messages: {cur.rowcount} row(s) deleted")

            cur.execute("DELETE FROM evaluation_logs")
            print(f"evaluation_logs: {cur.rowcount} row(s) deleted")

            cur.execute("DELETE FROM token_usage_logs")
            print(f"token_usage_logs: {cur.rowcount} row(s) deleted")

            cur.execute("DELETE FROM conversations")
            print(f"conversations: {cur.rowcount} row(s) deleted")
        conn.commit()
        print("MySQL conversations cleared.")
    finally:
        conn.close()


def clear_checkpoints() -> None:
    db_path = settings.CHECKPOINT_DB_PATH
    if not Path(db_path).exists():
        print(f"SQLite checkpoint not found at {db_path} — skipping")
        return

    conn = sqlite3.connect(db_path)
    try:
        cur = conn.cursor()
        for table in ("checkpoint_writes", "checkpoint_blobs", "checkpoints"):
            try:
                cur.execute(f"DELETE FROM {table}")
                print(f"  {table}: {cur.rowcount} row(s) deleted")
            except sqlite3.OperationalError as e:
                print(f"  {table}: skipped ({e})")
        conn.commit()
        print("LangGraph checkpoints cleared.")
    finally:
        conn.close()


if __name__ == "__main__":
    print("Clearing all conversations and checkpoints...\n")
    clear_mysql()
    clear_checkpoints()
    print("\nDone. All chats are fresh. Visitors will see empty conversations.")
