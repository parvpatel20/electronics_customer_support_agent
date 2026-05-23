"""Reset HITL test state for CUST-IN-008 (Ishita / ORD-IN-008).

Resets:
  - ORD-IN-008 status → delivered
  - INV-IN-008 status → paid, clears dispute_note
  - Deletes conversation + messages + eval/token logs for CUST-IN-008
  - Deletes LangGraph SQLite checkpoint rows for that thread

Run inside Docker:  docker compose exec backend python3 scripts/reset_hitl.py
Run locally:        python3 scripts/reset_hitl.py
"""

from __future__ import annotations

import os
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.config import settings
from backend.db.mysql_client import get_connection

CUSTOMER_ID = "CUST-IN-008"
CONVERSATION_ID = f"support-{CUSTOMER_ID}"


def reset_mysql() -> None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE orders SET status = 'delivered' WHERE order_id = 'ORD-IN-008'",
            )
            print(f"orders: {cur.rowcount} row(s) reset to delivered")

            cur.execute(
                "UPDATE invoices SET status = 'paid', dispute_note = NULL WHERE invoice_id = 'INV-IN-008'",
            )
            print(f"invoices: {cur.rowcount} row(s) reset to paid")

            cur.execute(
                "DELETE FROM evaluation_logs WHERE conversation_id = %s",
                (CONVERSATION_ID,),
            )
            cur.execute(
                "DELETE FROM token_usage_logs WHERE conversation_id = %s",
                (CONVERSATION_ID,),
            )
            cur.execute(
                "DELETE FROM messages WHERE conversation_id = %s",
                (CONVERSATION_ID,),
            )
            cur.execute(
                "DELETE FROM conversations WHERE conversation_id = %s",
                (CONVERSATION_ID,),
            )
            print(f"conversations/messages cleared for {CONVERSATION_ID}")
        conn.commit()


def reset_sqlite_checkpoint() -> None:
    db_path = settings.CHECKPOINT_DB_PATH
    if not os.path.exists(db_path):
        print(f"SQLite checkpoint not found at {db_path} — skipping")
        return

    conn = sqlite3.connect(db_path)
    try:
        cur = conn.cursor()
        for table in ("checkpoint_writes", "checkpoint_blobs", "checkpoints"):
            try:
                cur.execute(f"DELETE FROM {table} WHERE thread_id = ?", (CONVERSATION_ID,))
                print(f"  {table}: {cur.rowcount} row(s) deleted")
            except sqlite3.OperationalError as e:
                print(f"  {table}: skipped ({e})")
        conn.commit()
        print(f"SQLite checkpoint cleared for thread {CONVERSATION_ID}")
    finally:
        conn.close()


if __name__ == "__main__":
    print(f"Resetting HITL test state for {CUSTOMER_ID}...")
    reset_mysql()
    reset_sqlite_checkpoint()
    print("Done. ORD-IN-008 is delivery-eligible again. CUST-IN-008 can trigger HITL fresh.")
