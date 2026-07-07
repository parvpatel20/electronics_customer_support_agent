from __future__ import annotations

from typing import Any


def format_hitl_payload(value: Any) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None

    action_requests = value.get("action_requests") or []
    descriptions: list[str] = []
    refund_summary: dict[str, Any] | None = None
    for action in action_requests:
        if not isinstance(action, dict):
            continue
        description = action.get("description") or ""
        name = action.get("name") or "action"
        args = action.get("args") or {}
        if name == "process_refund":
            order_id = args.get("order_id", "the order")
            amount = args.get("amount")
            amount_text = f" ₹{amount}" if amount is not None else ""
            descriptions.append(f"Approve refund{amount_text} for order {order_id}?")
            refund_summary = {
                "order_id": args.get("order_id"),
                "amount": amount,
                "reason": args.get("reason"),
            }
        elif description:
            descriptions.append(description)
        else:
            descriptions.append(f"Approve {name}?")

    if not descriptions and value.get("review_configs"):
        descriptions.append("This action requires your approval before proceeding.")

    if not descriptions:
        return None

    payload: dict[str, Any] = {
        "description": " ".join(descriptions),
        "options": ["approve", "reject"],
        "action_requests": action_requests,
    }
    if refund_summary:
        payload["refund_summary"] = refund_summary
    return payload


def hitl_from_graph_state(graph_state) -> dict[str, Any] | None:
    if graph_state is None:
        return None

    for interrupt in getattr(graph_state, "interrupts", ()) or ():
        payload = format_hitl_payload(getattr(interrupt, "value", None))
        if payload:
            return payload

    for task in getattr(graph_state, "tasks", ()) or ():
        for interrupt in getattr(task, "interrupts", ()) or ():
            payload = format_hitl_payload(getattr(interrupt, "value", None))
            if payload:
                return payload

    if getattr(graph_state, "next", None):
        return {
            "description": "This action requires your approval before proceeding.",
            "options": ["approve", "reject"],
        }

    return None
