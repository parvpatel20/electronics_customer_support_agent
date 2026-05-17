from __future__ import annotations

import os
import socket
import sys
from urllib.parse import urlparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.config import settings


def main() -> int:
    print("Testing Phoenix Cloud tracing configuration")
    print(f"base_url={settings.PHOENIX_BASE_URL}")
    print(f"collector_endpoint={settings.PHOENIX_COLLECTOR_ENDPOINT}")
    print(f"project_name={settings.PHOENIX_PROJECT_NAME}")
    print(f"api_key_configured={bool(settings.PHOENIX_API_KEY)}")

    parsed = urlparse(settings.PHOENIX_COLLECTOR_ENDPOINT)
    if not parsed.hostname:
        print("Phoenix collector endpoint is invalid.")
        return 1
    try:
        socket.getaddrinfo(parsed.hostname, parsed.port or 443)
    except OSError as exc:
        print(f"Phoenix collector DNS resolution failed for {parsed.hostname}: {exc}")
        return 1

    os.environ["PHOENIX_COLLECTOR_ENDPOINT"] = settings.PHOENIX_COLLECTOR_ENDPOINT
    os.environ["PHOENIX_PROJECT_NAME"] = settings.PHOENIX_PROJECT_NAME
    os.environ["PHOENIX_BASE_URL"] = settings.PHOENIX_BASE_URL
    if settings.PHOENIX_API_KEY:
        os.environ["PHOENIX_API_KEY"] = settings.PHOENIX_API_KEY
    if settings.PHOENIX_CLIENT_HEADERS:
        os.environ["PHOENIX_CLIENT_HEADERS"] = settings.PHOENIX_CLIENT_HEADERS

    try:
        from opentelemetry import trace
        from phoenix.otel import register

        tracer_provider = register(
            project_name=settings.PHOENIX_PROJECT_NAME,
            endpoint=settings.PHOENIX_COLLECTOR_ENDPOINT,
            protocol="http/protobuf",
            batch=False,
            auto_instrument=True,
        )
        tracer = trace.get_tracer("techcart.debug")
        with tracer.start_as_current_span("techcart-phoenix-debug-span") as span:
            span.set_attribute("techcart.debug", True)
            span.set_attribute("techcart.project", settings.PHOENIX_PROJECT_NAME)
        flushed = tracer_provider.force_flush()
        if flushed is False:
            print("Phoenix tracer provider did not flush successfully.")
            return 1
    except Exception as exc:
        print(f"Phoenix trace export failed: {exc}")
        return 1

    print("Phoenix test span emitted. Check the Phoenix Cloud project for span: techcart-phoenix-debug-span")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
