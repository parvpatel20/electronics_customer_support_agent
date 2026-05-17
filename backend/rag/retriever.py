from __future__ import annotations

from langchain_core.documents import Document

from backend.config import settings
from backend.rag.common import get_vector_store


def _format_docs(title: str, docs: list[Document]) -> str:
    if not docs:
        return ""
    lines = [title]
    for index, doc in enumerate(docs, start=1):
        meta = doc.metadata
        source = meta.get("source_file", "unknown source")
        page = meta.get("page_number")
        sku = meta.get("product_sku")
        citation = f"{source}"
        if page is not None:
            citation += f", page {page}"
        if sku:
            citation += f", SKU {sku}"
        lines.append(f"[{index}] Source: {citation}\n{doc.page_content}")
    return "\n\n".join(lines)


def search_manuals(query: str, product_sku: str | None = None, k: int = 5, category: str | None = None) -> str:
    vector_store = get_vector_store(namespace=settings.pinecone_namespace)
    filters: dict[str, str] = {}
    if product_sku:
        filters["product_sku"] = product_sku
    if category:
        filters["category"] = category
    docs = vector_store.max_marginal_relevance_search(query=query, k=k, fetch_k=max(k * 4, 12), filter=filters or None)
    return _format_docs("Product documentation results:", docs)


def search_ticket_memory(query: str, product_sku: str | None = None, k: int = 3) -> str:
    vector_store = get_vector_store(namespace=settings.ticket_namespace)
    filters = {"product_sku": product_sku} if product_sku else None
    docs = vector_store.max_marginal_relevance_search(query=query, k=k, fetch_k=max(k * 4, 12), filter=filters)
    return _format_docs("Similar resolved ticket results:", docs)

