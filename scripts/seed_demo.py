"""Idempotent end-to-end demo seed.

Runs schema migrations, populates a comprehensive demo dataset on MySQL/TiDB,
and (optionally) ingests RAG manuals + tickets into Pinecone.

Customers are scoped to ``CUST-IN-%`` so the script can be re-run without
trampling other data. Run from the repo root:

    .venv313/bin/python scripts/seed_demo.py
"""
from __future__ import annotations

import logging
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.config import settings  # noqa: E402
from backend.db.mysql_client import get_connection  # noqa: E402
from backend.logging_config import configure_logging  # noqa: E402

SEED_MANUALS_DIR = ROOT / "data" / "seed_rag_india" / "manuals"
SEED_TICKETS_DIR = ROOT / "data" / "seed_rag_india" / "tickets"
PRODUCT_MANUALS_DIR = ROOT / "data" / "product_manuals"
SCHEMA_PATH = ROOT / "backend" / "db" / "schema.sql"

configure_logging()
logger = logging.getLogger("seed_demo")


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _fmt(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def _split_sql(sql: str) -> list[str]:
    cleaned_lines: list[str] = []
    for line in sql.splitlines():
        stripped = line.strip()
        if stripped.startswith("--") or not stripped:
            continue
        cleaned_lines.append(line)
    cleaned = "\n".join(cleaned_lines)
    return [statement.strip() for statement in re.split(r";\s*(?:\n|$)", cleaned) if statement.strip()]


def apply_schema(conn) -> None:
    statements = _split_sql(SCHEMA_PATH.read_text(encoding="utf-8"))
    with conn.cursor() as cur:
        for statement in statements:
            if statement.upper().startswith(("CREATE DATABASE", "USE ")):
                continue
            cur.execute(statement)
    conn.commit()
    logger.info("Applied %d schema statements", len(statements))


def clear_seed(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT conversation_id FROM conversations WHERE customer_id LIKE %s",
            ("CUST-IN-%",),
        )
        conv_ids = [row["conversation_id"] for row in cur.fetchall()]
        if conv_ids:
            placeholders = ",".join(["%s"] * len(conv_ids))
            cur.execute(f"DELETE FROM messages WHERE conversation_id IN ({placeholders})", conv_ids)
            cur.execute(f"DELETE FROM evaluation_logs WHERE conversation_id IN ({placeholders})", conv_ids)
            cur.execute(f"DELETE FROM token_usage_logs WHERE conversation_id IN ({placeholders})", conv_ids)
        cur.execute("DELETE FROM conversations WHERE customer_id LIKE %s", ("CUST-IN-%",))
        cur.execute("DELETE FROM returns WHERE customer_id LIKE %s", ("CUST-IN-%",))
        cur.execute("DELETE FROM invoices WHERE customer_id LIKE %s", ("CUST-IN-%",))
        cur.execute("DELETE FROM orders WHERE customer_id LIKE %s", ("CUST-IN-%",))
        cur.execute("DELETE FROM customers WHERE customer_id LIKE %s", ("CUST-IN-%",))
    conn.commit()


def seed_mysql(conn) -> None:
    now = _now()

    customers = [
        ("CUST-IN-001", "Priya Sharma", "priya.sharma@email.com", "+919821045678"),
        ("CUST-IN-002", "Arjun Mehta", "arjun.mehta@email.com", "+919711023456"),
        ("CUST-IN-003", "Kavya Nair", "kavya.nair@email.com", "+919845067890"),
        ("CUST-IN-004", "Rohit Verma", "rohit.verma@email.com", "+919876543210"),
        ("CUST-IN-005", "Sneha Iyer", "sneha.iyer@email.com", "+919820011223"),
        ("CUST-IN-006", "Vikram Singh", "vikram.singh@email.com", "+919831009988"),
        ("CUST-IN-007", "Aditya Rao", "aditya.rao@email.com", "+919900445566"),
        ("CUST-IN-008", "Ishita Banerjee", "ishita.banerjee@email.com", "+919804455667"),
    ]

    products = [
        (
            "ROUTER-WIFI6E-TC",
            "TechCart Wi-Fi 6E Router",
            "Networking",
            "220 x 160 x 45 mm",
            "680 g",
            "Wi-Fi 6E, Ethernet, USB-C 3.2 Gen 2",
            None,
            None,
            24,
            "24 months hardware and firmware defects under normal use.",
        ),
        (
            "RTX-4090-TC",
            "TechCart RTX 4090 Graphics Card",
            "GPU",
            "304 x 137 x 61 mm",
            "2.1 kg",
            "PCIe 4.0, HDMI 2.1, DisplayPort 1.4a",
            None,
            None,
            36,
            "36 months manufacturing defects. Physical damage excluded.",
        ),
        (
            "TN-200ANC-EARBUDS",
            "TechCart TN-200 ANC True Wireless Earbuds",
            "Audio",
            "62 x 45 x 22 mm (case)",
            "48 g",
            "Bluetooth 5.3, USB-C charging case",
            "Up to 8h buds (ANC on), 24h with case",
            None,
            12,
            "12 months manufacturing defects; no liquid or physical crush coverage.",
        ),
        (
            "TCFIT-V3-WATCH",
            "TechCart Fit V3 Smartwatch",
            "Wearables",
            "46 x 46 x 11 mm",
            "38 g",
            "Bluetooth 5.2, GPS (phone-assisted)",
            "Up to 5 days typical",
            '1.4" AMOLED 454x454',
            12,
            "12 months module defects; strap wear excluded.",
        ),
        (
            "TC-SOUNDBAR-MINI",
            "TechCart Soundbar Mini 2.1",
            "Home theatre",
            "800 x 95 x 60 mm",
            "2.4 kg",
            "HDMI eARC, Optical, Bluetooth 5.3",
            None,
            None,
            18,
            "18 months India warranty with GST invoice on file.",
        ),
        (
            "TC-USB-C-HUB-PRO",
            "TechCart USB-C Hub Pro",
            "Accessories",
            "115 x 55 x 12 mm",
            "120 g",
            "USB-C PD pass-through, HDMI 2.0, Ethernet, SD",
            None,
            None,
            24,
            "24 months defects; excludes bent pins and liquid exposure.",
        ),
    ]

    order_dates = {
        "ORD-IN-001": now - timedelta(days=5),    # refund-eligible delivered
        "ORD-IN-002": now - timedelta(days=2),    # shipped, in transit
        "ORD-IN-003": now - timedelta(days=45),   # outside refund window
        "ORD-IN-004": now - timedelta(days=10),   # disputed invoice
        "ORD-IN-005": now - timedelta(days=8),    # active RMA
        "ORD-IN-006": now - timedelta(days=1),    # pending
        "ORD-IN-007": now - timedelta(days=3),    # cancelled
        "ORD-IN-008": now - timedelta(days=4),    # delivered, recent, refund-eligible
    }

    orders = [
        (
            "ORD-IN-001",
            "CUST-IN-001",
            "TechCart Wi-Fi 6E Router",
            "ROUTER-WIFI6E-TC",
            1,
            14999.00,
            "delivered",
            "BD876543210IN",
            "Blue Dart",
            _fmt(order_dates["ORD-IN-001"]),
        ),
        (
            "ORD-IN-002",
            "CUST-IN-002",
            "TechCart Soundbar Mini 2.1",
            "TC-SOUNDBAR-MINI",
            1,
            16999.00,
            "shipped",
            "DL123456789IN",
            "Delhivery",
            _fmt(order_dates["ORD-IN-002"]),
        ),
        (
            "ORD-IN-003",
            "CUST-IN-003",
            "TechCart TN-200 ANC True Wireless Earbuds",
            "TN-200ANC-EARBUDS",
            1,
            8999.00,
            "delivered",
            "DTDC9988776655",
            "DTDC",
            _fmt(order_dates["ORD-IN-003"]),
        ),
        (
            "ORD-IN-004",
            "CUST-IN-004",
            "TechCart USB-C Hub Pro",
            "TC-USB-C-HUB-PRO",
            1,
            4499.00,
            "delivered",
            "BD1122334455IN",
            "Blue Dart",
            _fmt(order_dates["ORD-IN-004"]),
        ),
        (
            "ORD-IN-005",
            "CUST-IN-005",
            "TechCart Fit V3 Smartwatch",
            "TCFIT-V3-WATCH",
            1,
            11999.00,
            "delivered",
            "BD5544332211IN",
            "Blue Dart",
            _fmt(order_dates["ORD-IN-005"]),
        ),
        (
            "ORD-IN-006",
            "CUST-IN-006",
            "TechCart Wi-Fi 6E Router",
            "ROUTER-WIFI6E-TC",
            1,
            14999.00,
            "pending",
            None,
            None,
            _fmt(order_dates["ORD-IN-006"]),
        ),
        (
            "ORD-IN-007",
            "CUST-IN-007",
            "TechCart RTX 4090 Graphics Card",
            "RTX-4090-TC",
            1,
            189999.00,
            "cancelled",
            None,
            None,
            _fmt(order_dates["ORD-IN-007"]),
        ),
        (
            "ORD-IN-008",
            "CUST-IN-008",
            "TechCart TN-200 ANC True Wireless Earbuds",
            "TN-200ANC-EARBUDS",
            1,
            8999.00,
            "delivered",
            "BD2233445566IN",
            "Blue Dart",
            _fmt(order_dates["ORD-IN-008"]),
        ),
    ]

    invoices = [
        ("INV-IN-001", "ORD-IN-001", "CUST-IN-001", 14999.00, "INR", "paid", "Razorpay UPI"),
        ("INV-IN-002", "ORD-IN-002", "CUST-IN-002", 16999.00, "INR", "unpaid", "Netbanking pending"),
        ("INV-IN-003", "ORD-IN-003", "CUST-IN-003", 8999.00, "INR", "paid", "HDFC card ending 8810"),
        ("INV-IN-004", "ORD-IN-004", "CUST-IN-004", 4499.00, "INR", "disputed", "ICICI card ending 4421"),
        ("INV-IN-005", "ORD-IN-005", "CUST-IN-005", 11999.00, "INR", "paid", "PhonePe UPI"),
        ("INV-IN-007", "ORD-IN-007", "CUST-IN-007", 189999.00, "INR", "refunded", "Cancelled pre-auth"),
        ("INV-IN-008", "ORD-IN-008", "CUST-IN-008", 8999.00, "INR", "paid", "Razorpay UPI"),
    ]

    returns_rows = [
        (
            "RMA-IN-SNEHA01",
            "ORD-IN-005",
            "CUST-IN-005",
            "defective",
            "Screen lift at bezel after normal desk wear; photos attached in CRM.",
            "in_transit",
        ),
    ]

    conversations = [
        ("conv-in-priya-001", "CUST-IN-001", "technical", False),
        ("conv-in-rohit-001", "CUST-IN-004", "billing", False),
    ]

    messages = [
        (
            "conv-in-priya-001",
            "user",
            "Hi, I am Priya from Mumbai. Order ORD-IN-001 router drops 6 GHz when microwave runs.",
            "customer",
        ),
        (
            "conv-in-priya-001",
            "assistant",
            "Thanks Priya — that often points to interference. Please try moving the router away from the microwave and split IoT to 2.4 GHz; we can pull specs next.",
            "technical",
        ),
        (
            "conv-in-rohit-001",
            "user",
            "Rohit here — invoice INV-IN-004 charged twice for the hub. Please raise dispute.",
            "customer",
        ),
        (
            "conv-in-rohit-001",
            "assistant",
            "I see INV-IN-004 is already marked disputed in billing; sharing next steps for resolution.",
            "billing",
        ),
    ]

    dispute_note = "Customer reports duplicate authorization hold on ICICI; bank SMS reference ICICI8821 attached."

    with conn.cursor() as cur:
        cur.executemany(
            "INSERT INTO customers (customer_id, name, email, phone) VALUES (%s, %s, %s, %s)",
            customers,
        )
        cur.executemany(
            """
            INSERT INTO products (
                product_sku, product_name, category, dimensions, weight,
                connectivity, battery, display_specs, warranty_months, warranty_terms
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                product_name = VALUES(product_name),
                category = VALUES(category),
                dimensions = VALUES(dimensions),
                weight = VALUES(weight),
                connectivity = VALUES(connectivity),
                battery = VALUES(battery),
                display_specs = VALUES(display_specs),
                warranty_months = VALUES(warranty_months),
                warranty_terms = VALUES(warranty_terms)
            """,
            products,
        )
        cur.executemany(
            """
            INSERT INTO orders (
                order_id, customer_id, product_name, product_sku, quantity, price,
                status, tracking_number, carrier, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            orders,
        )
        cur.executemany(
            """
            INSERT INTO invoices (invoice_id, order_id, customer_id, amount, currency, status, payment_method)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            invoices,
        )
        cur.execute(
            "UPDATE invoices SET dispute_note = %s WHERE invoice_id = %s",
            (dispute_note, "INV-IN-004"),
        )
        cur.executemany(
            """
            INSERT INTO returns (
                return_authorization_number, order_id, customer_id, reason, item_condition, status
            ) VALUES (%s, %s, %s, %s, %s, %s)
            """,
            returns_rows,
        )
        cur.executemany(
            """
            INSERT INTO conversations (conversation_id, customer_id, triage_result, resolved)
            VALUES (%s, %s, %s, %s)
            """,
            conversations,
        )
        cur.executemany(
            """
            INSERT INTO messages (conversation_id, role, content, agent_name)
            VALUES (%s, %s, %s, %s)
            """,
            messages,
        )
    conn.commit()


def seed_pinecone() -> tuple[int, int]:
    if not settings.has_pinecone:
        logger.warning("Pinecone/HF tokens not configured — skipping vector ingest.")
        return 0, 0
    if not SEED_MANUALS_DIR.is_dir() or not SEED_TICKETS_DIR.is_dir():
        logger.warning("RAG seed directories missing; skipping vector ingest.")
        return 0, 0
    from backend.rag.ingestor import ingest_documents_from_directory, ingest_support_tickets

    manual_chunks = ingest_documents_from_directory(SEED_MANUALS_DIR, namespace=settings.pinecone_namespace)
    ticket_chunks = ingest_support_tickets(SEED_TICKETS_DIR)
    return manual_chunks, ticket_chunks


def main() -> int:
    try:
        conn = get_connection(autocommit=False)
    except Exception as exc:
        logger.error("Cannot connect to MySQL/TiDB: %s", exc)
        return 1

    try:
        apply_schema(conn)
        clear_seed(conn)
        seed_mysql(conn)
        logger.info("MySQL: demo customers, catalog, orders, invoices, returns, sample chats inserted.")
    except Exception:
        conn.rollback()
        logger.exception("MySQL seed failed; rolled back.")
        return 1
    finally:
        conn.close()

    try:
        manuals, tickets = seed_pinecone()
        if manuals or tickets:
            logger.info(
                "Pinecone: ingested %d manual chunks into '%s' and %d ticket chunks into '%s'.",
                manuals,
                settings.pinecone_namespace,
                tickets,
                settings.ticket_namespace,
            )
        else:
            logger.info("Pinecone ingest produced no chunks (configuration or directories missing).")
    except Exception:
        logger.warning(
            "Pinecone ingest failed (MySQL already committed). "
            "Re-run `python -m backend.rag.ingestor` once the HF/Pinecone endpoints recover."
        )

    logger.info("Try customer ids in the UI: CUST-IN-001 … CUST-IN-008")
    logger.info(
        "Orders cover delivered-refundable, in-transit, out-of-window, disputed-invoice, "
        "active-RMA, pending, cancelled, and a clean second-customer refund path."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
