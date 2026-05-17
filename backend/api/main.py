from __future__ import annotations

import asyncio
import json
import logging
from uuid import uuid4

from fastapi import BackgroundTasks, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain_core.messages import AIMessage, HumanMessage
from langgraph.types import Command
from pydantic import BaseModel, Field

from backend.config import settings
from backend.db.mysql_client import execute_query, fetch_all, fetch_one
from backend.evaluation.llm_judge import judge_conversation
from backend.graph.multi_agent_graph import techcart_graph
from backend.api.hitl import hitl_from_graph_state
from backend.memory.conversation import (
    build_turn_messages,
    conversation_id_for_customer,
    load_recent_chat_messages,
    trim_stored_messages,
)
from backend.observability.phoenix_setup import configure_phoenix

logger = logging.getLogger(__name__)

configure_phoenix()

app = FastAPI(title="TechCart AI Support", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    customer_id: str = Field(min_length=1, max_length=64)
    message: str = Field(min_length=1, max_length=4000)


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=1, max_length=255)


class ApprovalRequest(BaseModel):
    decision: str = "approve"
    reason: str | None = None


class ChatApprovalRequest(BaseModel):
    """Customer-facing approval for HITL interrupts (e.g. refund approval)."""
    customer_id: str = Field(min_length=1, max_length=64)
    decision: str = Field(pattern=r"^(approve|reject)$")
    reason: str | None = None


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, default=str)}\n\n"


def _chunk_text(chunk) -> str:
    if chunk is None:
        return ""
    content = getattr(chunk, "content", "")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict):
                parts.append(str(block.get("text") or ""))
            else:
                parts.append(str(getattr(block, "text", block) or ""))
        return "".join(parts)
    return str(content) if content else ""


def _format_error(exc: Exception) -> str:
    message = str(exc).strip()
    if message:
        return message
    return f"{type(exc).__name__}: graph execution failed"


def _graph_config(conversation_id: str) -> dict:
    return {
        "configurable": {"thread_id": conversation_id},
        "recursion_limit": settings.GRAPH_RECURSION_LIMIT,
    }


def _ensure_customer(customer_id: str) -> None:
    execute_query(
        """
        INSERT IGNORE INTO customers (customer_id, name, email, phone)
        VALUES (%s, %s, NULL, NULL)
        """,
        (customer_id, f"Customer {customer_id}"),
    )


def _ensure_customer_conversation(customer_id: str) -> str:
    _ensure_customer(customer_id)
    conversation_id = conversation_id_for_customer(customer_id)
    execute_query(
        """
        INSERT INTO conversations (conversation_id, customer_id, triage_result, resolved)
        VALUES (%s, %s, NULL, FALSE)
        ON DUPLICATE KEY UPDATE customer_id = VALUES(customer_id)
        """,
        (conversation_id, customer_id),
    )
    return conversation_id


def _save_message(conversation_id: str, role: str, content: str, agent_name: str | None = None) -> None:
    try:
        execute_query(
            """
            INSERT INTO messages (conversation_id, role, content, agent_name)
            VALUES (%s, %s, %s, %s)
            """,
            (conversation_id, role, content, agent_name),
        )
    except Exception as exc:
        # Retry once on transient connection drop.
        try:
            execute_query(
                """
                INSERT INTO messages (conversation_id, role, content, agent_name)
                VALUES (%s, %s, %s, %s)
                """,
                (conversation_id, role, content, agent_name),
            )
        except Exception:
            logger.error("Failed to save message after retry: %s", exc)
    trim_stored_messages(conversation_id)


def _auth_admin(admin_password: str | None) -> None:
    if settings.ADMIN_PASSWORD and admin_password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin password")


@app.post("/auth/login")
async def login(request: LoginRequest) -> dict:
    identifier = request.identifier.strip()
    customer = fetch_one(
        """
        SELECT customer_id, name, email, phone
        FROM customers
        WHERE customer_id = %s OR email = %s
        """,
        (identifier, identifier),
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found. Use a seeded customer ID or email.")
    return {"customer": customer}


async def _run_judge_background(conversation_id: str, original_message: str, triage_route: str, final_response: str) -> None:
    resolved_signal = any(word in final_response.lower() for word in ["resolved", "thank", "fixed", "worked"])
    try:
        await judge_conversation(
            conversation_id=conversation_id,
            original_message=original_message,
            triage_route=triage_route,
            tools_called=[],
            final_response=final_response,
            resolved_signal=resolved_signal,
        )
    except Exception:
        # Evaluation must never break the customer response path.
        return


@app.post("/chat")
async def chat(request: ChatRequest, background_tasks: BackgroundTasks) -> StreamingResponse:
    try:
        conversation_id = _ensure_customer_conversation(request.customer_id)
        config = _graph_config(conversation_id)
        prior = await techcart_graph.aget_state(config)
        continuing = bool(prior and prior.values and prior.values.get("messages"))
        messages = build_turn_messages(
            request.customer_id,
            conversation_id,
            request.message,
            continuing_thread=continuing,
        )
        _save_message(conversation_id, "user", request.message)
    except Exception as exc:
        conversation_id = conversation_id_for_customer(request.customer_id)
        config = _graph_config(conversation_id)
        messages = build_turn_messages(
            request.customer_id,
            conversation_id,
            request.message,
            continuing_thread=False,
        )

        async def startup_error_stream():
            message = (
                "Support is temporarily having trouble opening your account context. "
                "Please retry in a moment; your message was not processed yet."
            )
            yield _sse("metadata", {"conversation_id": conversation_id})
            yield _sse("content", {"agent_name": "supervisor", "content": message})
            yield _sse("error", {"message": str(exc), "conversation_id": conversation_id})
            yield _sse("done", {"conversation_id": conversation_id, "agent_name": "supervisor"})

        return StreamingResponse(startup_error_stream(), media_type="text/event-stream")

    initial_state = {
        "messages": messages,
        "customer_id": request.customer_id,
        "conversation_id": conversation_id,
        "turn_count": 0,
    }

    async def event_stream():
        final_text_parts: list[str] = []
        emitted_node_messages: set[str] = set()
        triage_route = "unknown"
        active_agent = "triage"
        yield _sse("metadata", {"conversation_id": conversation_id})
        try:
            async for event in techcart_graph.astream_events(initial_state, config=config, version="v2"):
                kind = event.get("event")
                name = event.get("name")
                data = event.get("data", {})

                if kind == "on_chat_model_stream":
                    chunk = data.get("chunk")
                    content = _chunk_text(chunk)
                    if content:
                        final_text_parts.append(content)
                        yield _sse("content", {"agent_name": active_agent, "content": content})

                # Tool events are suppressed from SSE — kept internal only.
                # (No tool_start / tool_end events emitted to the frontend.)

                elif kind == "on_chain_end" and name == "triage_node":
                    output = data.get("output") or {}
                    triage = output.get("triage_result") or {}
                    triage_route = triage.get("route", "unknown")
                    active_agent = triage_route
                    execute_query(
                        "UPDATE conversations SET triage_result = %s WHERE conversation_id = %s",
                        (triage_route, conversation_id),
                    )
                    yield _sse("agent_name", {"agent_name": active_agent, "triage": triage})

                elif kind == "on_chain_end" and name in {
                    "billing_node",
                    "technical_node",
                    "returns_node",
                    "supervisor_node",
                    "human_escalation_node",
                }:
                    output = data.get("output") or {}
                    active_agent = output.get("active_agent") or active_agent
                    if not final_text_parts:
                        for msg in output.get("messages", []) or []:
                            content = getattr(msg, "content", None)
                            msg_type = getattr(msg, "type", None)
                            if msg_type == "ai" and content and content not in emitted_node_messages:
                                emitted_node_messages.add(content)
                                final_text_parts.append(content)
                                yield _sse("content", {"agent_name": active_agent, "content": content})
                    yield _sse("agent_name", {"agent_name": active_agent})

                await asyncio.sleep(0)

            try:
                graph_state = await techcart_graph.aget_state(config)
                hitl = hitl_from_graph_state(graph_state)
                if hitl:
                    if not final_text_parts:
                        approval_intro = (
                            f"{hitl['description']}\n\n"
                            "Use the Approve or Reject buttons below to continue."
                        )
                        final_text_parts.append(approval_intro)
                        yield _sse("content", {"agent_name": active_agent, "content": approval_intro})
                    yield _sse("hitl_approval", {
                        "conversation_id": conversation_id,
                        "agent_name": active_agent,
                        "description": hitl["description"],
                        "options": hitl["options"],
                    })
            except Exception:
                pass

            final_text = "".join(final_text_parts).strip()
            if final_text:
                _save_message(conversation_id, "assistant", final_text, active_agent)
                background_tasks.add_task(_run_judge_background, conversation_id, request.message, triage_route, final_text)
            yield _sse("done", {"conversation_id": conversation_id, "agent_name": active_agent})
        except Exception as exc:
            logger.exception("Chat graph failed for conversation %s", conversation_id)
            raw_error = _format_error(exc)
            if "rate_limit" in raw_error.lower() or "429" in raw_error:
                fallback = (
                    "Support is temporarily busy processing requests. Please wait a few minutes and retry; "
                    "your account context and message are safe."
                )
            elif "GraphRecursionError" in type(exc).__name__ or "recursion limit" in raw_error.lower():
                fallback = (
                    "I reached the maximum number of automated billing steps for this message. "
                    "Please send a shorter follow-up (for example: approve the refund, or ask only for eligibility)."
                )
            else:
                fallback = (
                    "I hit an internal support workflow error before I could complete this request. "
                    "Please retry once, or contact a human support specialist with this conversation ID."
                )
            _save_message(conversation_id, "assistant", fallback, "supervisor")
            yield _sse("content", {"agent_name": "supervisor", "content": fallback})
            yield _sse("error", {"message": raw_error, "conversation_id": conversation_id})
            yield _sse("done", {"conversation_id": conversation_id, "agent_name": "supervisor"})

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/chat/approve")
async def chat_approve(request: ChatApprovalRequest, background_tasks: BackgroundTasks) -> StreamingResponse:
    """Customer-facing HITL approval endpoint. Resumes an interrupted graph and streams the result."""
    conversation_id = _ensure_customer_conversation(request.customer_id)
    config = _graph_config(conversation_id)

    decision = {"type": request.decision}
    if request.reason:
        decision["message"] = request.reason

    async def approval_stream():
        yield _sse("metadata", {"conversation_id": conversation_id})
        try:
            result = await techcart_graph.ainvoke(
                Command(resume={"decisions": [decision]}),
                config=config,
            )
            messages = result.get("messages", [])
            final = next((m.content for m in reversed(messages) if isinstance(m, AIMessage)), "")
            if final:
                _save_message(conversation_id, "assistant", final, "billing")
                yield _sse("content", {"agent_name": "billing", "content": final})
            yield _sse("done", {"conversation_id": conversation_id, "agent_name": "billing"})
        except Exception as exc:
            fallback = "There was an issue processing the approval. Please try again."
            yield _sse("content", {"agent_name": "supervisor", "content": fallback})
            yield _sse("error", {"message": str(exc), "conversation_id": conversation_id})
            yield _sse("done", {"conversation_id": conversation_id, "agent_name": "supervisor"})

    return StreamingResponse(approval_stream(), media_type="text/event-stream")


@app.get("/customers/{customer_id}/support")
async def customer_support(customer_id: str) -> dict:
    """Single support thread per customer: recent messages and any pending HITL approval."""
    conversation_id = _ensure_customer_conversation(customer_id)
    rows = load_recent_chat_messages(conversation_id)
    config = _graph_config(conversation_id)
    hitl_pending = None
    try:
        graph_state = await techcart_graph.aget_state(config)
        hitl_pending = hitl_from_graph_state(graph_state)
    except Exception:
        pass

    return {
        "conversation_id": conversation_id,
        "messages": rows,
        "hitl_pending": hitl_pending,
    }


@app.get("/admin/metrics")
async def admin_metrics(x_admin_password: str | None = Header(default=None)) -> dict:
    _auth_admin(x_admin_password)
    totals = fetch_one(
        """
        SELECT
            COUNT(*) AS total_conversations,
            SUM(CASE WHEN started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS conversations_this_week
        FROM conversations
        """
    ) or {}
    evals = fetch_one(
        """
        SELECT
            AVG(routing_accuracy_score) AS avg_routing_accuracy,
            AVG(response_quality_score) AS avg_response_quality,
            AVG(tool_precision_score) AS avg_tool_precision
        FROM evaluation_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        """
    ) or {}
    cost = fetch_one(
        """
        SELECT SUM(input_tokens) AS input_tokens, SUM(output_tokens) AS output_tokens,
               SUM(estimated_cost_usd) AS estimated_cost_usd
        FROM token_usage_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        """
    ) or {}
    recent = fetch_all(
        """
        SELECT c.conversation_id, c.customer_id, c.triage_result, c.resolved, c.started_at,
               e.routing_accuracy_score, e.tool_precision_score, e.response_quality_score
        FROM conversations c
        LEFT JOIN evaluation_logs e ON e.conversation_id = c.conversation_id
        ORDER BY c.started_at DESC
        LIMIT 20
        """
    )
    return {"totals": totals, "evaluation": evals, "usage": cost, "recent_conversations": recent, "pending_approvals": []}


@app.post("/admin/approve-refund/{conversation_id}")
async def approve_refund(
    conversation_id: str,
    body: ApprovalRequest,
    x_admin_password: str | None = Header(default=None),
) -> dict:
    _auth_admin(x_admin_password)
    decision = {"type": body.decision}
    if body.reason:
        decision["message"] = body.reason
    result = await techcart_graph.ainvoke(
        Command(resume={"decisions": [decision]}),
        config={"configurable": {"thread_id": conversation_id}},
    )
    messages = result.get("messages", [])
    final = next((m.content for m in reversed(messages) if isinstance(m, AIMessage)), "")
    if final:
        _save_message(conversation_id, "assistant", final, "billing")
    return {"ok": True, "conversation_id": conversation_id, "final_response": final}


@app.get("/admin/traces")
async def admin_traces(x_admin_password: str | None = Header(default=None)) -> dict:
    _auth_admin(x_admin_password)
    return {"phoenix_url": settings.PHOENIX_BASE_URL, "project_name": settings.PHOENIX_PROJECT_NAME}


@app.get("/health")
async def health() -> dict:
    return {"ok": True, "env": settings.ENV}
