from __future__ import annotations

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage

from backend.config import settings
from backend.db.mysql_client import execute_query, fetch_all
from backend.memory.long_term import load_customer_history


def conversation_id_for_customer(customer_id: str) -> str:
    return f"support-{customer_id}"


def _dedupe_chat_rows(rows: list[dict]) -> list[dict]:
    deduped: list[dict] = []
    for row in rows:
        content = (row.get("content") or "").strip()
        if (
            deduped
            and deduped[-1].get("role") == row.get("role")
            and (deduped[-1].get("content") or "").strip() == content
        ):
            continue
        deduped.append(row)
    return deduped


def load_recent_chat_messages(conversation_id: str, limit: int | None = None) -> list[dict]:
    keep = limit or settings.CHAT_HISTORY_MESSAGE_LIMIT
    rows = fetch_all(
        """
        SELECT role, content, agent_name, created_at
        FROM messages
        WHERE conversation_id = %s AND role IN ('user', 'assistant')
        ORDER BY created_at DESC
        LIMIT %s
        """,
        (conversation_id, keep),
    )[::-1]
    return _dedupe_chat_rows(rows)


def trim_stored_messages(conversation_id: str, keep: int | None = None) -> None:
    keep = keep or settings.CHAT_STORED_MESSAGE_LIMIT
    execute_query(
        """
        DELETE FROM messages
        WHERE conversation_id = %s
          AND message_id NOT IN (
            SELECT message_id FROM (
                SELECT message_id
                FROM messages
                WHERE conversation_id = %s
                ORDER BY created_at DESC
                LIMIT %s
            ) AS recent
          )
        """,
        (conversation_id, conversation_id, keep),
    )


def build_conversation_messages(
    customer_id: str,
    conversation_id: str,
    message: str,
) -> list[BaseMessage]:
    history = load_customer_history(customer_id)
    messages: list[BaseMessage] = [
        SystemMessage(
            content=(
                f"Authenticated customer_id for this session: {customer_id}\n"
                "Use this customer_id for every account-scoped tool call unless the customer "
                "explicitly authenticates as a different account.\n\n"
                f"Relevant customer history:\n{history}"
            )
        )
    ]

    recent = load_recent_chat_messages(conversation_id, settings.CHAT_CONTEXT_MESSAGE_LIMIT)
    if recent and recent[-1].get("role") == "user" and (recent[-1].get("content") or "").strip() == message.strip():
        recent = recent[:-1]

    for row in recent:
        content = row.get("content") or ""
        if not content:
            continue
        if row["role"] == "user":
            messages.append(HumanMessage(content=content))
        elif row["role"] == "assistant":
            messages.append(AIMessage(content=content))

    messages.append(HumanMessage(content=message))
    return messages


def build_turn_messages(
    customer_id: str,
    conversation_id: str,
    message: str,
    *,
    continuing_thread: bool,
) -> list[BaseMessage]:
    """Pass only the new user turn when the graph checkpoint already has history."""
    if continuing_thread:
        return [HumanMessage(content=message)]
    return build_conversation_messages(customer_id, conversation_id, message)


def trim_messages_for_agent(messages: list[BaseMessage], limit: int | None = None) -> list[BaseMessage]:
    """Keep system context and the most recent turns to avoid agent tool loops."""
    keep = limit or settings.AGENT_MESSAGE_LIMIT
    if len(messages) <= keep:
        return list(messages)

    system = [message for message in messages if isinstance(message, SystemMessage)]
    non_system = [message for message in messages if not isinstance(message, SystemMessage)]
    tail = non_system[-keep:]
    return (system[:1] if system else []) + tail
