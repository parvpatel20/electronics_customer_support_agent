from __future__ import annotations

import ssl as ssl_module
from contextlib import contextmanager
from typing import Any, Iterable

import pymysql
from pymysql.connections import Connection
from pymysql.cursors import DictCursor

from backend.config import settings


def _connection_kwargs(autocommit: bool = False) -> dict[str, Any]:
    kwargs: dict[str, Any] = {
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
    }
    # TiDB Cloud serverless requires TLS; use SSLContext (pymysql ssl=) not legacy ssl_ca kwargs alone.
    ctx = ssl_module.create_default_context()
    if settings.MYSQL_SSL_CA:
        ctx.load_verify_locations(settings.MYSQL_SSL_CA)
    if settings.MYSQL_SSL_VERIFY_CERT:
        ctx.verify_mode = ssl_module.CERT_REQUIRED
        ctx.check_hostname = bool(settings.MYSQL_SSL_VERIFY_IDENTITY)
    else:
        ctx.check_hostname = False
        ctx.verify_mode = ssl_module.CERT_NONE
    kwargs["ssl"] = ctx
    return kwargs


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


def fetch_one(query: str, params: tuple[Any, ...] | dict[str, Any] | None = None) -> dict[str, Any] | None:
    with connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params or ())
        row = cursor.fetchone()
        cursor.close()
        return row


def fetch_all(query: str, params: tuple[Any, ...] | dict[str, Any] | None = None) -> list[dict[str, Any]]:
    with connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params or ())
        rows = cursor.fetchall()
        cursor.close()
        return rows


def execute_query(query: str, params: tuple[Any, ...] | dict[str, Any] | None = None) -> int:
    with connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params or ())
        affected = cursor.rowcount
        cursor.close()
        return affected


def execute_many(query: str, values: Iterable[tuple[Any, ...] | dict[str, Any]]) -> int:
    with connection() as conn:
        cursor = conn.cursor()
        cursor.executemany(query, list(values))
        affected = cursor.rowcount
        cursor.close()
        return affected
