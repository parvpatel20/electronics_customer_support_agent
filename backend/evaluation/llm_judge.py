from __future__ import annotations

from pydantic import BaseModel, Field

from backend.db.mysql_client import execute_query
from backend.models import get_fast_model


class JudgeResult(BaseModel):
    routing_accuracy_score: int = Field(ge=1, le=5)
    tool_precision_score: int = Field(ge=1, le=5)
    response_quality_score: int = Field(ge=1, le=5)
    judge_reasoning: str


JUDGE_PROMPT = """You are an internal evaluator for TechCart AI support.
Score 1-5:
- routing_accuracy_score: whether triage chose the correct specialist.
- tool_precision_score: whether tool calls were necessary, ordered, and correctly argued.
- response_quality_score: whether the final answer was accurate, complete, empathetic, and actionable.
Return strict structured output."""


async def judge_conversation(
    conversation_id: str,
    original_message: str,
    triage_route: str,
    tools_called: list[str],
    final_response: str,
    resolved_signal: bool,
) -> JudgeResult:
    model = get_fast_model().with_structured_output(JudgeResult)
    result = await model.ainvoke(
        [
            ("system", JUDGE_PROMPT),
            (
                "human",
                f"conversation_id={conversation_id}\noriginal={original_message}\nroute={triage_route}\n"
                f"tools={tools_called}\nfinal={final_response}\nresolved_signal={resolved_signal}",
            ),
        ]
    )
    judged = result if isinstance(result, JudgeResult) else JudgeResult.model_validate(result)
    execute_query(
        """
        INSERT INTO evaluation_logs
        (conversation_id, routing_accuracy_score, tool_precision_score, response_quality_score, judge_reasoning)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (
            conversation_id,
            judged.routing_accuracy_score,
            judged.tool_precision_score,
            judged.response_quality_score,
            judged.judge_reasoning,
        ),
    )
    return judged

