from __future__ import annotations

from backend.db.mysql_client import fetch_all


def load_customer_history(customer_id: str, limit: int = 3) -> str:
    conversations = fetch_all(
        """
        SELECT conversation_id, started_at, triage_result, resolved
        FROM conversations
        WHERE customer_id = %s AND resolved = TRUE
        ORDER BY started_at DESC
        LIMIT %s
        """,
        (customer_id, limit),
    )
    if not conversations:
        return "No previous resolved conversations for this customer."

    summaries: list[str] = []
    for conversation in conversations:
        messages = fetch_all(
            """
            SELECT role, content, agent_name
            FROM messages
            WHERE conversation_id = %s
            ORDER BY created_at ASC
            LIMIT 8
            """,
            (conversation["conversation_id"],),
        )
        text = " | ".join(f"{m['role']}: {m['content'][:180]}" for m in messages)
        summaries.append(
            f"{conversation['started_at']}: route={conversation['triage_result']}, resolved={conversation['resolved']}. {text}"
        )
    return "\n".join(summaries)

