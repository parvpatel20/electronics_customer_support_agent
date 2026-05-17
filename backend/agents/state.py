from __future__ import annotations

from typing import Any

from langchain.agents import AgentState
from typing_extensions import NotRequired


class TechCartAgentState(AgentState):
    customer_id: NotRequired[str]
    triage_result: NotRequired[dict[str, Any]]
    active_agent: NotRequired[str]
    conversation_id: NotRequired[str]
    turn_count: NotRequired[int]
    product_sku: NotRequired[str]
    handoff_task: NotRequired[str]

