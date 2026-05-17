from __future__ import annotations

import asyncio
from decimal import Decimal
from typing import Any

from langchain.agents.middleware import AgentMiddleware, AgentState

from backend.db.mysql_client import execute_query

GROQ_PRICING_PER_MILLION = {
    "llama-3.3-70b-versatile": {"input": Decimal("0.59"), "output": Decimal("0.79")},
    "llama-3.1-8b-instant": {"input": Decimal("0.05"), "output": Decimal("0.08")},
}


class TokenTrackerMiddleware(AgentMiddleware):
    def __init__(self, agent_name: str, model_name: str):
        super().__init__()
        self.agent_name = agent_name
        self.model_name = model_name

    async def aafter_model(self, state: AgentState, runtime: Any) -> dict[str, Any] | None:
        last_message = state["messages"][-1] if state.get("messages") else None
        usage = getattr(last_message, "usage_metadata", None) or {}
        input_tokens = int(usage.get("input_tokens") or 0)
        output_tokens = int(usage.get("output_tokens") or 0)
        if input_tokens == 0 and output_tokens == 0:
            return None

        conversation_id = state.get("conversation_id")
        price = GROQ_PRICING_PER_MILLION.get(self.model_name, {"input": Decimal("0"), "output": Decimal("0")})
        estimated_cost = (Decimal(input_tokens) * price["input"] + Decimal(output_tokens) * price["output"]) / Decimal(1_000_000)
        await asyncio.to_thread(
            execute_query,
            """
            INSERT INTO token_usage_logs
            (conversation_id, agent_name, model_name, input_tokens, output_tokens, estimated_cost_usd)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (conversation_id, self.agent_name, self.model_name, input_tokens, output_tokens, estimated_cost),
        )
        return None

