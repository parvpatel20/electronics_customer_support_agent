from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from langchain_core.tools import tool

from backend.db.mysql_client import execute_query, fetch_one
from backend.tools.utils import error, to_json


@tool
def get_invoice_details(invoice_id: str, customer_id: str) -> str:
    """Get invoice details for a customer, including amount, status, payment method, order, and product name."""
    try:
        row = fetch_one(
            """
            SELECT i.invoice_id, i.amount, i.currency, i.status, i.payment_method, i.created_at,
                   o.order_id, o.product_name, o.product_sku, o.status AS order_status
            FROM invoices i
            JOIN orders o ON o.order_id = i.order_id
            WHERE i.invoice_id = %s AND i.customer_id = %s
            """,
            (invoice_id, customer_id),
        )
        return to_json({"ok": True, "invoice": row}) if row else error("Invoice not found for this customer.")
    except Exception as exc:
        return error(f"Unable to fetch invoice details: {exc}")


@tool
def check_refund_eligibility(order_id: str, customer_id: str | None = None) -> str:
    """Check whether an order is eligible for refund under the 30-day delivered-order refund policy. Provide customer_id when available."""
    try:
        if not customer_id:
            return error("customer_id is required to check refund eligibility.")
        if customer_id:
            order = fetch_one(
                "SELECT order_id, customer_id, status, created_at, price FROM orders WHERE order_id = %s AND customer_id = %s",
                (order_id, customer_id),
            )
        else:
            order = fetch_one("SELECT order_id, customer_id, status, created_at, price FROM orders WHERE order_id = %s", (order_id,))
        if not order:
            return error("Order not found for this customer.")
        if order["status"] == "returned":
            return to_json({"ok": True, "eligible": False, "reason": "Order has already been returned."})
        if order["status"] != "delivered":
            return to_json({"ok": True, "eligible": False, "reason": "Only delivered orders are refundable."})

        created_at = order["created_at"]
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        age_days = (datetime.now(timezone.utc) - created_at).days
        eligible = age_days <= 30
        reason = "Order is delivered and within the 30-day refund window." if eligible else "Order is outside the 30-day refund window."
        return to_json({"ok": True, "eligible": eligible, "age_days": age_days, "reason": reason, "amount": order["price"]})
    except Exception as exc:
        return error(f"Unable to check refund eligibility: {exc}")


@tool
def process_refund(order_id: str, amount: float, reason: str, customer_id: str | None = None) -> str:
    """Process a refund for an eligible order. Requires human approval before execution. Provide customer_id when available."""
    try:
        if not customer_id:
            return error("customer_id is required to process a refund.")
        if customer_id:
            order = fetch_one(
                """
                SELECT o.order_id, o.customer_id, o.status, c.name AS customer_name
                FROM orders o JOIN customers c ON c.customer_id = o.customer_id
                WHERE o.order_id = %s AND o.customer_id = %s
                """,
                (order_id, customer_id),
            )
        else:
            order = fetch_one(
                """
                SELECT o.order_id, o.customer_id, o.status, c.name AS customer_name
                FROM orders o JOIN customers c ON c.customer_id = o.customer_id
                WHERE o.order_id = %s
                """,
                (order_id,),
            )
        if not order:
            return error("Order not found for this customer.")
        if order["status"] == "returned":
            return error("Order is already marked returned.")
        execute_query("UPDATE invoices SET status = 'refunded' WHERE order_id = %s", (order_id,))
        execute_query("UPDATE orders SET status = 'returned' WHERE order_id = %s", (order_id,))
        return to_json(
            {
                "ok": True,
                "refund_reference": f"RF-{uuid4().hex[:10].upper()}",
                "order_id": order_id,
                "customer_id": order["customer_id"],
                "customer_name": order["customer_name"],
                "amount": amount,
                "reason": reason,
            }
        )
    except Exception as exc:
        return error(f"Unable to process refund: {exc}")


@tool
def update_payment_dispute(invoice_id: str, dispute_reason: str) -> str:
    """Mark an invoice as disputed and create a dispute ticket reference."""
    try:
        affected = execute_query(
            "UPDATE invoices SET status = 'disputed', dispute_note = %s WHERE invoice_id = %s",
            (dispute_reason, invoice_id),
        )
        if affected == 0:
            return error("Invoice not found.")
        return to_json({"ok": True, "ticket_reference": f"DSP-{uuid4().hex[:10].upper()}", "invoice_id": invoice_id})
    except Exception as exc:
        return error(f"Unable to update payment dispute: {exc}")


BILLING_TOOLS = [get_invoice_details, check_refund_eligibility, process_refund, update_payment_dispute]
