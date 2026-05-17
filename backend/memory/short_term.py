from __future__ import annotations

from langchain_core.messages import HumanMessage, SystemMessage

from backend.memory.conversation import build_conversation_messages, conversation_id_for_customer

__all__ = ["build_initial_messages", "build_conversation_messages", "conversation_id_for_customer"]


def build_initial_messages(customer_id: str, message: str) -> list[SystemMessage | HumanMessage]:
    conversation_id = conversation_id_for_customer(customer_id)
    return build_conversation_messages(customer_id, conversation_id, message)
