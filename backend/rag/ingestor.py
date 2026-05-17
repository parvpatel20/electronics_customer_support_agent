from __future__ import annotations

import time
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader, UnstructuredMarkdownLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from backend.config import settings
from backend.rag.common import get_vector_store


def _load_file(path: Path) -> list[Document]:
    if path.suffix.lower() == ".pdf":
        return PyPDFLoader(str(path)).load()
    if path.suffix.lower() in {".md", ".markdown"}:
        return UnstructuredMarkdownLoader(str(path)).load()
    return []


def _metadata_for(path: Path, doc: Document) -> dict[str, str | int]:
    stem_parts = path.stem.split("__")
    product_sku = stem_parts[0] if stem_parts else path.stem
    category = stem_parts[1] if len(stem_parts) > 1 else "manual"
    page = doc.metadata.get("page")
    return {
        "source_file": path.name,
        "product_name": path.stem.replace("_", " "),
        "product_sku": product_sku,
        "category": category,
        "page_number": int(page) if page is not None else 0,
    }


def ingest_documents_from_directory(directory: Path, namespace: str | None = None) -> int:
    """Load PDF/Markdown under ``directory`` into Pinecone using ``namespace`` (default: manuals namespace)."""
    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)
    vector_store = get_vector_store(namespace=namespace or settings.pinecone_namespace)

    chunks: list[Document] = []
    for path in sorted(directory.glob("**/*")):
        if path.suffix.lower() not in {".pdf", ".md", ".markdown"}:
            continue
        for doc in _load_file(path):
            doc.metadata.update(_metadata_for(path, doc))
            chunks.extend(splitter.split_documents([doc]))

    total = 0
    for start in range(0, len(chunks), 10):
        batch = chunks[start : start + 10]
        vector_store.add_documents(batch)
        total += len(batch)
        time.sleep(1)
    return total


def ingest_product_manuals(directory: Path | None = None, namespace: str | None = None) -> int:
    source_dir = directory or settings.PRODUCT_MANUALS_DIR
    return ingest_documents_from_directory(source_dir, namespace=namespace)


def ingest_support_tickets(directory: Path, namespace: str | None = None) -> int:
    """Ingest resolved-ticket writeups into the ticket memory namespace (``tickets:<env>`` by default)."""
    return ingest_documents_from_directory(directory, namespace=namespace or settings.ticket_namespace)


if __name__ == "__main__":
    count = ingest_product_manuals()
    print(f"Ingested {count} chunks into Pinecone namespace {settings.pinecone_namespace}.")

