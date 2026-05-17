from __future__ import annotations

"""
Idempotent India-focused demo seed for MySQL (TiDB) and targeted Pinecone ingest.

- Removes prior rows keyed by customer_id LIKE 'CUST-IN-%' (and linked orders, etc.).
- Inserts customers with Indian names, INR invoices, and varied order states for agent testing.
- Ingests only ``data/seed_rag_india/manuals`` and ``data/seed_rag_india/tickets`` (no duplicate of default ``data/product_manuals``).

Run from repo root:

    .venv313/bin/python scripts/seed_india_demo.py
"""

import sys
from datetime import timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.config import settings  # noqa: E402
from backend.db.mysql_client import get_connection  # noqa: E402
from backend.rag.ingestor import ingest_documents_from_directory, ingest_support_tickets  # noqa: E402

SEED_MANUALS_DIR = ROOT / "data" / "seed_rag_india" / "manuals"
SEED_TICKETS_DIR = ROOT / "data" / "seed_rag_india" / "tickets"


def _utcnow():
    from datetime import datetime

    return datetime.now(timezone.utc)


def _fmt(dt):
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def clear_india_seed(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT conversation_id FROM conversations WHERE customer_id LIKE %s",
            ("CUST-IN-%",),
        )
        conv_ids = [row["conversation_id"] for row in cur.fetchall()]
        if conv_ids:
            ph = ",".join(["%s"] * len(conv_ids))
            cur.execute(f"DELETE FROM messages WHERE conversation_id IN ({ph})", conv_ids)
            cur.execute(f"DELETE FROM evaluation_logs WHERE conversation_id IN ({ph})", conv_ids)
            cur.execute(f"DELETE FROM token_usage_logs WHERE conversation_id IN ({ph})", conv_ids)
        cur.execute("DELETE FROM conversations WHERE customer_id LIKE %s", ("CUST-IN-%",))
        cur.execute("DELETE FROM returns WHERE customer_id LIKE %s", ("CUST-IN-%",))
        cur.execute("DELETE FROM invoices WHERE customer_id LIKE %s", ("CUST-IN-%",))
        cur.execute("DELETE FROM orders WHERE customer_id LIKE %s", ("CUST-IN-%",))
        cur.execute("DELETE FROM customers WHERE customer_id LIKE %s", ("CUST-IN-%",))


def seed_mysql(conn) -> None:
    now = _utcnow()

    customers = [
        ("CUST-IN-001", "Priya Sharma", "priya.sharma@email.com", "+919821045678"),
        ("CUST-IN-002", "Arjun Mehta", "arjun.mehta@email.com", "+919711023456"),
        ("CUST-IN-003", "Kavya Nair", "kavya.nair@email.com", "+919845067890"),
        ("CUST-IN-004", "Rohit Verma", "rohit.verma@email.com", "+919876543210"),
        ("CUST-IN-005", "Sneha Iyer", "sneha.iyer@email.com", "+919820011223"),
        ("CUST-IN-006", "Vikram Singh", "vikram.singh@email.com", "+919831009988"),
        ("CUST-IN-007", "Aditya Rao", "aditya.rao@email.com", "+919900445566"),
    ]

    products = [
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
            "India carry-in warranty: manufacturing defects; no liquid or physical crush.",
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
            "18 months India warranty with GST invoice.",
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
            "24 months; excludes bent pins and liquid.",
        ),
    ]

    # Order timelines (relative to now) for refund/return window tests
    o_priya = now - timedelta(days=5)
    o_arjun = now - timedelta(days=2)
    o_kavya = now - timedelta(days=45)
    o_rohit = now - timedelta(days=10)
    o_sneha = now - timedelta(days=8)
    o_vikram = now - timedelta(days=1)
    o_aditya = now - timedelta(days=3)

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
            _fmt(o_priya),
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
            _fmt(o_arjun),
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
            _fmt(o_kavya),
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
            _fmt(o_rohit),
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
            _fmt(o_sneha),
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
            _fmt(o_vikram),
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
            _fmt(o_aditya),
        ),
    ]

    invoices = [
        ("INV-IN-001", "ORD-IN-001", "CUST-IN-001", 14999.00, "INR", "paid", "Razorpay UPI"),
        ("INV-IN-002", "ORD-IN-002", "CUST-IN-002", 16999.00, "INR", "unpaid", "Netbanking pending"),
        ("INV-IN-003", "ORD-IN-003", "CUST-IN-003", 8999.00, "INR", "paid", "HDFC card ending 8810"),
        ("INV-IN-004", "ORD-IN-004", "CUST-IN-004", 4499.00, "INR", "disputed", "ICICI card ending 4421"),
        ("INV-IN-005", "ORD-IN-005", "CUST-IN-005", 11999.00, "INR", "paid", "PhonePe UPI"),
        ("INV-IN-007", "ORD-IN-007", "CUST-IN-007", 189999.00, "INR", "refunded", "Cancelled pre-auth"),
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
        ("conv-in-priya-001", "user", "Hi, I am Priya from Mumbai. Order ORD-IN-001 router drops 6 GHz when microwave runs.", "customer"),
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
            """
            INSERT INTO customers (customer_id, name, email, phone)
            VALUES (%s, %s, %s, %s)
            """,
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


def seed_pinecone() -> tuple[int, int]:
    if not SEED_MANUALS_DIR.is_dir() or not SEED_TICKETS_DIR.is_dir():
        raise FileNotFoundError("Expected data/seed_rag_india/manuals and .../tickets to exist.")
    manual_chunks = ingest_documents_from_directory(SEED_MANUALS_DIR, namespace=settings.pinecone_namespace)
    ticket_chunks = ingest_support_tickets(SEED_TICKETS_DIR)
    return manual_chunks, ticket_chunks


def main() -> int:
    conn = get_connection(autocommit=False)
    try:
        clear_india_seed(conn)
        seed_mysql(conn)
        conn.commit()
        print("MySQL: India demo customers, catalog rows, orders, invoices, returns, and sample chats inserted.")
    except Exception as exc:
        conn.rollback()
        print(f"MySQL seed failed: {exc}")
        return 1
    finally:
        conn.close()

    try:
        m, t = seed_pinecone()
        print(
            f"Pinecone: ingested {m} manual chunks into namespace '{settings.pinecone_namespace}' "
            f"and {t} ticket chunks into '{settings.ticket_namespace}'."
        )
    except Exception as exc:
        print(f"Pinecone ingest failed (MySQL already committed): {exc}")
        return 1

    print("\nTry these customer_ids in the UI: CUST-IN-001 … CUST-IN-007")
    print("Orders: ORD-IN-001 (refund-eligible delivered) … ORD-IN-007 (cancelled + refunded invoice)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
