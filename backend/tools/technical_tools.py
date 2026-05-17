from __future__ import annotations

from datetime import datetime, timezone

from langchain_core.tools import tool

from backend.db.mysql_client import fetch_one
from backend.rag.retriever import search_manuals, search_ticket_memory
from backend.tools.utils import error, to_json


@tool
def get_order_product_context(order_id: str, customer_id: str) -> str:
    """Resolve an authenticated customer's order into product name, SKU, status, and warranty metadata."""
    try:
        row = fetch_one(
            """
            SELECT o.order_id, o.status, o.product_name, o.product_sku,
                   p.warranty_months, p.warranty_terms
            FROM orders o
            LEFT JOIN products p ON p.product_sku = o.product_sku
            WHERE o.order_id = %s AND o.customer_id = %s
            """,
            (order_id, customer_id),
        )
        return to_json({"ok": True, "order_product": row}) if row else error("Order not found for this customer.")
    except Exception as exc:
        return error(f"Unable to resolve order product context: {exc}")


@tool
def search_product_docs(query: str, product_sku: str | None = None) -> str:
    """Search product manuals, warranty documents, and spec sheets. Always cite returned sources in the final answer."""
    try:
        manual_results = search_manuals(query=query, product_sku=product_sku, k=5)
        ticket_results = search_ticket_memory(query=query, product_sku=product_sku, k=3)
        return "\n\n".join([manual_results, ticket_results]).strip() or "No relevant documentation found."
    except Exception as exc:
        return error(f"Unable to search product docs: {exc}")


@tool
def get_product_specs(product_sku: str) -> str:
    """Get structured product specifications from the catalog for an exact product SKU."""
    try:
        row = fetch_one("SELECT * FROM products WHERE product_sku = %s", (product_sku,))
        return to_json({"ok": True, "specs": row}) if row else error("Product SKU not found.")
    except Exception as exc:
        return error(f"Unable to get product specs: {exc}")


@tool
def check_warranty_status(order_id: str, customer_id: str) -> str:
    """Check warranty status for a customer's order using purchase date and product warranty terms."""
    try:
        row = fetch_one(
            """
            SELECT o.order_id, o.created_at, o.product_sku, o.product_name,
                   p.warranty_months, p.warranty_terms
            FROM orders o
            LEFT JOIN products p ON p.product_sku = o.product_sku
            WHERE o.order_id = %s AND o.customer_id = %s
            """,
            (order_id, customer_id),
        )
        if not row:
            return error("Order not found for this customer.")
        created_at = row["created_at"]
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        elapsed_months = max(0, (datetime.now(timezone.utc) - created_at).days // 30)
        warranty_months = row.get("warranty_months") or 12
        return to_json(
            {
                "ok": True,
                "in_warranty": elapsed_months <= warranty_months,
                "elapsed_months": elapsed_months,
                "warranty_months": warranty_months,
                "warranty_terms": row.get("warranty_terms"),
                "product_name": row.get("product_name"),
                "product_sku": row.get("product_sku"),
            }
        )
    except Exception as exc:
        return error(f"Unable to check warranty status: {exc}")


@tool
def get_compatibility_info(product_sku: str, accessory_query: str) -> str:
    """Search compatibility documentation for a product SKU and accessory or device query."""
    try:
        query = f"compatibility {accessory_query}"
        return search_manuals(query=query, product_sku=product_sku, k=5, category="compatibility")
    except Exception as exc:
        return error(f"Unable to get compatibility information: {exc}")


TECHNICAL_TOOLS = [get_order_product_context, search_product_docs, get_product_specs, check_warranty_status, get_compatibility_info]
