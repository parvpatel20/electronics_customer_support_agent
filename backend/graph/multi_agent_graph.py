from __future__ import annotations

import logging
import re
from typing import Any, Literal

from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import END, START, MessagesState, StateGraph
from typing_extensions import NotRequired

from backend.agents.billing_agent import billing_agent
from backend.agents.returns_agent import returns_agent
from backend.agents.supervisor import supervisor_agent
from backend.agents.technical_agent import technical_agent
from backend.agents.triage import TriageResult, heuristic_triage, run_triage
from backend.config import settings
from backend.db.mysql_client import fetch_one
from backend.graph.checkpointer import get_checkpointer
from backend.memory.conversation import trim_messages_for_agent
from backend.rag.retriever import search_manuals, search_ticket_memory

logger = logging.getLogger(__name__)


class TechCartState(MessagesState):
    customer_id: NotRequired[str]
    triage_result: NotRequired[dict[str, Any]]
    active_agent: NotRequired[str]
    conversation_id: NotRequired[str]
    turn_count: NotRequired[int]
    product_sku: NotRequired[str]
    handoff_task: NotRequired[str]
    routing_error: NotRequired[str]


def _latest_human_message(state: TechCartState) -> str:
    for msg in reversed(state["messages"]):
        if getattr(msg, "type", None) == "human":
            return str(msg.content)
    return ""


def _conversation_context(state: TechCartState, max_messages: int = 8) -> str:
    recent = state["messages"][-max_messages:]
    lines: list[str] = []
    for msg in recent:
        msg_type = getattr(msg, "type", "message")
        content = str(getattr(msg, "content", ""))[:700]
        if content:
            lines.append(f"{msg_type}: {content}")
    context = "\n".join(lines)
    route = state.get("triage_result")
    if route:
        context += f"\nprevious_triage: {route}"
    return context[:4000]


async def triage_node(state: TechCartState) -> dict[str, Any]:
    latest_human = _latest_human_message(state)
    triage = heuristic_triage(latest_human)
    if triage is None:
        try:
            triage = await run_triage(latest_human, state.get("customer_id"), _conversation_context(state))
        except Exception as exc:
            triage = TriageResult(
                route="supervisor",
                urgency="medium",
                confidence=0.0,
                summary="Automated triage failed; routing to supervisor fallback.",
                detected_intents=["unclear", "escalation"],
                needs_clarification=True,
                escalation_reason=str(exc),
            )
    updates: dict[str, Any] = {
        "triage_result": triage.model_dump(),
        "active_agent": triage.route,
        "turn_count": int(state.get("turn_count", 0)) + 1,
    }
    if triage.escalation_reason:
        updates["routing_error"] = triage.escalation_reason
    if triage.customer_id and not state.get("customer_id"):
        updates["customer_id"] = triage.customer_id
    if triage.product_sku:
        updates["product_sku"] = triage.product_sku
    return updates


def route_after_triage(state: TechCartState) -> Literal["billing_node", "technical_node", "returns_node", "supervisor_node"]:
    triage = TriageResult.model_validate(state.get("triage_result", {}))
    if triage.confidence < 0.6 or triage.route == "supervisor":
        return "supervisor_node"
    return {
        "billing": "billing_node",
        "technical": "technical_node",
        "returns": "returns_node",
        "supervisor": "supervisor_node",
    }[triage.route]


async def supervisor_node(state: TechCartState) -> dict[str, Any]:
    triage_data = state.get("triage_result") or {}
    triage = TriageResult.model_validate(triage_data) if triage_data else None
    if triage:
        intents = set(triage.detected_intents)
        if "out_of_scope" in intents:
            return {
                "messages": [
                    AIMessage(
                        content=(
                            "I can help with TechCart support questions like orders, delivery, returns, invoices, refunds, "
                            "warranty, product setup, or troubleshooting. What TechCart issue do you need help with?"
                        )
                    )
                ],
                "active_agent": "supervisor",
            }
        support_intents = intents.intersection({"billing", "technical", "returns"})
        if triage.needs_clarification and len(support_intents) >= 2:
            labels = ", ".join(sorted(support_intents))
            return {
                "messages": [
                    AIMessage(
                        content=(
                            f"I can help with the {labels} parts of this, but I need to handle one path first so I do not miss anything. "
                            "Do you want troubleshooting, billing/refund help, or order/return help first?"
                        )
                    )
                ],
                "active_agent": "supervisor",
            }
        if triage.needs_clarification:
            return {
                "messages": [
                    AIMessage(
                        content=(
                            "I need one more detail to route this correctly. Are you asking about delivery/tracking, a return/RMA, "
                            "billing/refund, warranty, or product troubleshooting?"
                        )
                    )
                ],
                "active_agent": "supervisor",
            }
    result = await supervisor_agent.ainvoke(state)
    return {**result, "active_agent": state.get("active_agent", "supervisor")}


async def billing_node(state: TechCartState, config: RunnableConfig) -> dict[str, Any]:
    billing_config = {**config, "recursion_limit": settings.BILLING_RECURSION_LIMIT}
    billing_state = {
        **state,
        "messages": trim_messages_for_agent(state.get("messages", [])),
    }
    result = await billing_agent.ainvoke(billing_state, billing_config)
    return {**result, "active_agent": "billing"}


async def technical_node(state: TechCartState) -> dict[str, Any]:
    try:
        result = await technical_agent.ainvoke(state)
        return {**result, "active_agent": "technical"}
    except Exception as exc:
        fallback = _technical_fallback_answer(state, exc)
        return {"messages": [AIMessage(content=fallback)], "active_agent": "technical"}


def _technical_fallback_answer(state: TechCartState, exc: Exception) -> str:
    message = _latest_human_message(state)
    customer_id = state.get("customer_id")
    product_sku = state.get("product_sku")
    order_match = re.search(r"\bORD-[A-Z0-9-]+\b", message, re.I)
    product_name = None
    if order_match and customer_id:
        try:
            row = fetch_one(
                """
                SELECT product_name, product_sku
                FROM orders
                WHERE order_id = %s AND customer_id = %s
                """,
                (order_match.group(0).upper(), customer_id),
            )
            if row:
                product_sku = row.get("product_sku") or product_sku
                product_name = row.get("product_name")
        except Exception:
            pass

    docs = ""
    if product_sku:
        try:
            docs = "\n\n".join(
                part
                for part in (
                    search_manuals(query=message, product_sku=product_sku, k=2),
                    search_ticket_memory(query=message, product_sku=product_sku, k=1),
                )
                if part
            )
        except Exception:
            docs = ""

    intro = "I had trouble completing the automated technical workflow, but I can still help with a safe next step."
    if product_name and product_sku:
        intro = f"I found this under your account as {product_name} ({product_sku}). The automated technical workflow had a temporary issue, so here are safe next steps."

    guidance = (
        "1. Restart the product and test again with one variable changed at a time.\n"
        "2. Check cables, charging, firmware/app updates, and the exact error or symptom timing.\n"
        "3. If this is connectivity or interference, move the device away from appliances, test another band/port/cable, and note whether the issue follows the device or the environment.\n"
        "4. If it still fails, share the product model/SKU, order id, firmware/app version, and what changed before the issue started."
    )
    if docs:
        return f"{intro}\n\nRelevant support references were found for {product_sku}:\n{docs[:1400]}\n\nSuggested next steps:\n{guidance}"
    return f"{intro}\n\nSuggested next steps:\n{guidance}\n\nTechnical error reference: {type(exc).__name__}"


async def returns_node(state: TechCartState) -> dict[str, Any]:
    result = await returns_agent.ainvoke(state)
    return {**result, "active_agent": "returns"}


async def human_escalation_node(state: TechCartState) -> dict[str, Any]:
    task = state.get("handoff_task", "This issue requires a human support agent.")
    return {"messages": [AIMessage(content=f"I am escalating this to a human support specialist. Context: {task}")], "active_agent": "human"}


def build_graph():
    graph = StateGraph(TechCartState)
    graph.add_node("triage_node", triage_node)
    graph.add_node("supervisor_node", supervisor_node)
    graph.add_node("billing_node", billing_node)
    graph.add_node("technical_node", technical_node)
    graph.add_node("returns_node", returns_node)
    graph.add_node("human_escalation_node", human_escalation_node)

    graph.add_edge(START, "triage_node")
    graph.add_conditional_edges("triage_node", route_after_triage)
    graph.add_edge("supervisor_node", END)
    graph.add_edge("billing_node", END)
    graph.add_edge("technical_node", END)
    graph.add_edge("returns_node", END)
    graph.add_edge("human_escalation_node", END)
    return graph.compile(checkpointer=get_checkpointer())


techcart_graph = build_graph()
