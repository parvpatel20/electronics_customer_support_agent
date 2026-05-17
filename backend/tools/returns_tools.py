from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from langchain_core.tools import tool

from backend.db.mysql_client import execute_query, fetch_all, fetch_one
from backend.tools.utils import error, to_json


@tool
def lookup_order(order_id: str | None = None, customer_id: str | None = None) -> str:
    """Look up order details by order ID or customer ID, including status, tracking, carrier, and timestamps."""
    try:
        if order_id and not customer_id:
            return error("customer_id is required when looking up a specific order.")
        if order_id and customer_id:
            rows = fetch_all("SELECT * FROM orders WHERE order_id = %s AND customer_id = %s", (order_id, customer_id))
        elif order_id:
            rows = fetch_all("SELECT * FROM orders WHERE order_id = %s", (order_id,))
        elif customer_id:
            rows = fetch_all("SELECT * FROM orders WHERE customer_id = %s ORDER BY created_at DESC LIMIT 10", (customer_id,))
        else:
            return error("Provide order_id or customer_id.")
        return to_json({"ok": True, "orders": rows})
    except Exception as exc:
        return error(f"Unable to look up order: {exc}")


@tool
def get_delivery_status(tracking_number: str, carrier: str) -> str:
    """Get current delivery status from a mock carrier tracker for a tracking number and carrier."""
    eta = (datetime.now(timezone.utc) + timedelta(days=2)).date().isoformat()
    return to_json(
        {
            "ok": True,
            "tracking_number": tracking_number,
            "carrier": carrier,
            "status": "In transit" if tracking_number else "Tracking unavailable",
            "last_scan_location": "Regional sorting facility",
            "estimated_delivery_date": eta,
        }
    )


@tool
def initiate_return(order_id: str, reason: str, item_condition: str, customer_id: str | None = None) -> str:
    """Initiate a return after validating return-window eligibility and order status. Provide customer_id when available."""
    try:
        if not customer_id:
            return error("customer_id is required to initiate a return.")
        if reason not in {"damaged", "wrong_item", "changed_mind", "defective"}:
            return error("Invalid reason. Use damaged, wrong_item, changed_mind, or defective.")
        if customer_id:
            order = fetch_one("SELECT * FROM orders WHERE order_id = %s AND customer_id = %s", (order_id, customer_id))
        else:
            order = fetch_one("SELECT * FROM orders WHERE order_id = %s", (order_id,))
        if not order:
            return error("Order not found for this customer.")
        if order["status"] not in {"delivered", "shipped"}:
            return error(f"Order status {order['status']} is not eligible for return initiation.")
        created_at = order["created_at"]
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        if (datetime.now(timezone.utc) - created_at).days > 30:
            return error("Order is outside the 30-day return window.")
        ran = f"RMA-{uuid4().hex[:10].upper()}"
        execute_query(
            """
            INSERT INTO returns (return_authorization_number, order_id, customer_id, reason, item_condition, status)
            VALUES (%s, %s, %s, %s, %s, 'approved')
            """,
            (ran, order_id, order["customer_id"], reason, item_condition),
        )
        return to_json(
            {
                "ok": True,
                "return_authorization_number": ran,
                "instructions": "Pack the item securely, include all accessories, and write the RMA on the label.",
                "billing_note": reason in {"damaged", "defective"},
            }
        )
    except Exception as exc:
        return error(f"Unable to initiate return: {exc}")


@tool
def get_return_status(return_authorization_number: str, customer_id: str | None = None) -> str:
    """Get current status of an in-progress return using the return authorization number. Provide customer_id when available."""
    try:
        if not customer_id:
            return error("customer_id is required when checking return status.")
        if customer_id:
            row = fetch_one(
                "SELECT * FROM returns WHERE return_authorization_number = %s AND customer_id = %s",
                (return_authorization_number, customer_id),
            )
        else:
            row = fetch_one("SELECT * FROM returns WHERE return_authorization_number = %s", (return_authorization_number,))
        return to_json({"ok": True, "return": row}) if row else error("Return authorization not found.")
    except Exception as exc:
        return error(f"Unable to get return status: {exc}")


RETURNS_TOOLS = [lookup_order, get_delivery_status, initiate_return, get_return_status]
