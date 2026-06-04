from __future__ import annotations

import logging
import sys

from backend.config import settings

_CONFIGURED = False

# Uvicorn emits its own "INFO:     Application startup complete." /
# "Application shutdown complete." / per-request access lines. The OpenTelemetry
# log instrumentation (set up by Phoenix's register(auto_instrument=True))
# captures these and the OTel severity mapping can misclassify them as ERROR
# in the Phoenix dashboard, creating noisy false-positive alerts. Silencing
# them at the source keeps the dashboard clean while still letting the app
# emit its own INFO/WARN logs to stdout for local debugging.
_QUIET_LOGGERS = (
    "uvicorn",
    "uvicorn.error",
    "uvicorn.access",
    "uvicorn.lifespan",
    "uvicorn.server",
)

_VERY_NOISY_LOGGERS = (
    "pymysql",
    "urllib3",
    "httpx",
    "httpcore",
)


def configure_logging() -> None:
    global _CONFIGURED
    if _CONFIGURED:
        return

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            fmt="%(asctime)s %(levelname)s %(name)s %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S",
        )
    )

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(settings.LOG_LEVEL)

    for name in _VERY_NOISY_LOGGERS:
        logging.getLogger(name).setLevel(logging.WARNING)

    # Uvicorn loggers: keep WARNING+ for the OTel exporter so Phoenix only
    # sees real warnings (e.g. unhandled exceptions). Local stdout still
    # receives them at WARNING+.
    for name in _QUIET_LOGGERS:
        logging.getLogger(name).setLevel(logging.WARNING)

    _CONFIGURED = True
