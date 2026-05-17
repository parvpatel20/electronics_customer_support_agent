from __future__ import annotations

import os

from backend.config import settings


def _patch_tracer_interrupt() -> None:
    """Patch OpenInferenceTracer to suppress on_interrupt AttributeError.

    openinference-instrumentation-langchain may not implement on_interrupt,
    which LangGraph's interrupt machinery calls.  Adding a no-op fallback
    prevents the error without breaking tracing.
    """
    try:
        from openinference.instrumentation.langchain._tracer import (
            OpenInferenceTracer,
        )

        if not hasattr(OpenInferenceTracer, "on_interrupt"):
            OpenInferenceTracer.on_interrupt = lambda self, *a, **kw: None  # type: ignore[attr-defined]
        if not hasattr(OpenInferenceTracer, "on_resume"):
            OpenInferenceTracer.on_resume = lambda self, *a, **kw: None  # type: ignore[attr-defined]
    except (ImportError, AttributeError):
        # Package missing or internal structure changed — safe to skip.
        pass


def configure_phoenix() -> None:
    # Patch before registering so that the tracer never raises on interrupts.
    _patch_tracer_interrupt()

    try:
        from phoenix.otel import register
    except ImportError:
        return

    os.environ["PHOENIX_COLLECTOR_ENDPOINT"] = settings.PHOENIX_COLLECTOR_ENDPOINT
    os.environ["PHOENIX_PROJECT_NAME"] = settings.PHOENIX_PROJECT_NAME
    if settings.PHOENIX_API_KEY:
        os.environ["PHOENIX_API_KEY"] = settings.PHOENIX_API_KEY
    if settings.PHOENIX_CLIENT_HEADERS:
        os.environ["PHOENIX_CLIENT_HEADERS"] = settings.PHOENIX_CLIENT_HEADERS
    if settings.PHOENIX_BASE_URL:
        os.environ["PHOENIX_BASE_URL"] = settings.PHOENIX_BASE_URL

    try:
        register(
            project_name=settings.PHOENIX_PROJECT_NAME,
            endpoint=settings.PHOENIX_COLLECTOR_ENDPOINT,
            protocol="http/protobuf",
            batch=True,
            auto_instrument=True,
        )
    except Exception:
        # Tracing is optional; API and RAG must still start without a reachable collector.
        return
