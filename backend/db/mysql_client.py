from __future__ import annotations

import logging
import ssl as ssl_module
import time
from contextlib import contextmanager
from typing import Any, Iterable

import pymysql
from pymysql.connections import Connection
from pymysql.cursors import DictCursor
from pymysql.err import InterfaceError, OperationalError

from backend.config import settings

logger = logging.getLogger(__name__)

_TRANSIENT_ERRORS = (InterfaceError, OperationalError)


def _ssl_context() -> ssl_module.SSLContext:
    ctx = ssl_module.create_default_context()
    if settings.MYSQL_SSL_CA:
        ctx.load_verify_locations(settings.MYSQL_SSL_CA)
    if settings.MYSQL_SSL_VERIFY_CERT:
        ctx.verify_mode = ssl_module.CERT_REQUIRED
        ctx.check_hostname = bool(settings.MYSQL_SSL_VERIFY_IDENTITY)
    else:
        ctx.check_hostname = False
        ctx.verify_mode = ssl_module.CERT_NONE
    return ctx


def _connection_kwargs(autocommit: bool) -> dict[str, Any]:
    return {
        "host": settings.MYSQL_HOST,
        "port": settings.MYSQL_PORT,
        "user": settings.MYSQL_USER,
        "password": settings.MYSQL_PASSWORD,
        "database": settings.MYSQL_DATABASE,
        "autocommit": autocommit,
        "cursorclass": DictCursor,
        "connect_timeout": 10,
        "read_timeout": 30,
        "write_timeout": 30,
        "charset": "utf8mb4",
        "ssl": _ssl_context(),
    }


def get_connection(autocommit: bool = False) -> Connection:
    return pymysql.connect(**_connection_kwargs(autocommit=autocommit))


@contextmanager
def connection():
    conn = get_connection(autocommit=False)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _run(action, retries: int = 1, backoff: float = 0.3):
    last_exc: Exception | None = None
    for attempt in range(retries + 1):
        try:
            return action()
        except _TRANSIENT_ERRORS as exc:
            last_exc = exc
            if attempt >= retries:
                break
            logger.warning("MySQL transient error (attempt %s/%s): %s", attempt + 1, retries + 1, exc)
            time.sleep(backoff * (2 ** attempt))
    raise last_exc  # type: ignore[misc]


def fetch_one(query: str, params: tuple[Any, ...] | dict[str, Any] | None = None) -> dict[str, Any] | None:
    def action():
        with connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params or ())
            row = cursor.fetchone()
            cursor.close()
            return row

    return _run(action)


def fetch_all(query: str, params: tuple[Any, ...] | dict[str, Any] | None = None) -> list[dict[str, Any]]:
    def action():
        with connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params or ())
            rows = cursor.fetchall()
            cursor.close()
            return rows

    return _run(action)


def execute_query(query: str, params: tuple[Any, ...] | dict[str, Any] | None = None) -> int:
    def action():
        with connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params or ())
            affected = cursor.rowcount
            cursor.close()
            return affected

    return _run(action)


def execute_many(query: str, values: Iterable[tuple[Any, ...] | dict[str, Any]]) -> int:
    def action():
        with connection() as conn:
            cursor = conn.cursor()
            cursor.executemany(query, list(values))
            affected = cursor.rowcount
            cursor.close()
            return affected

    return _run(action)


def ping() -> bool:
    try:
        conn = get_connection(autocommit=True)
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
            return True
        finally:
            conn.close()
    except Exception as exc:
        logger.warning("MySQL ping failed: %s", exc)
        return False
