from __future__ import annotations

from functools import lru_cache

from langchain_huggingface import HuggingFaceEndpointEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec

from backend.config import settings


@lru_cache
def get_embeddings() -> HuggingFaceEndpointEmbeddings:
    return HuggingFaceEndpointEmbeddings(
        model=settings.HF_EMBEDDING_MODEL,
        task="feature-extraction",
        huggingfacehub_api_token=settings.HF_TOKEN or None,
    )


@lru_cache
def get_pinecone_client() -> Pinecone:
    return Pinecone(api_key=settings.PINECONE_API_KEY)


def ensure_pinecone_index() -> None:
    pc = get_pinecone_client()
    index_list = pc.list_indexes()
    existing = set(index_list.names()) if hasattr(index_list, "names") else {index["name"] for index in index_list}
    if settings.PINECONE_INDEX_NAME not in existing:
        pc.create_index(
            name=settings.PINECONE_INDEX_NAME,
            dimension=settings.EMBEDDING_DIMENSION,
            metric="cosine",
            spec=ServerlessSpec(cloud=settings.PINECONE_CLOUD, region=settings.PINECONE_REGION),
        )


def get_vector_store(namespace: str | None = None) -> PineconeVectorStore:
    ensure_pinecone_index()
    return PineconeVectorStore(
        index_name=settings.PINECONE_INDEX_NAME,
        embedding=get_embeddings(),
        namespace=namespace or settings.pinecone_namespace,
        pinecone_api_key=settings.PINECONE_API_KEY,
    )
