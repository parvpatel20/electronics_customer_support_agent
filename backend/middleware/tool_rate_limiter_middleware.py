from __future__ import annotations

from langchain.agents.middleware import ToolCallLimitMiddleware


def build_tool_rate_limiter(max_tool_calls: int) -> ToolCallLimitMiddleware:
    return ToolCallLimitMiddleware(run_limit=max_tool_calls, exit_behavior="continue")

