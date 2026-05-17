from functools import lru_cache

from langchain_groq import ChatGroq

from backend.config import settings


@lru_cache
def get_primary_model() -> ChatGroq:
    return ChatGroq(
        model=settings.PRIMARY_MODEL,
        temperature=0,
        max_retries=3,
        api_key=settings.GROQ_API_KEY or "missing-groq-api-key",
    )


@lru_cache
def get_fast_model() -> ChatGroq:
    return ChatGroq(
        model=settings.FAST_MODEL,
        temperature=0,
        max_retries=2,
        api_key=settings.GROQ_API_KEY or "missing-groq-api-key",
    )
