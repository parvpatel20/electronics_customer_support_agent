from __future__ import annotations

import asyncio
import logging
import ssl as ssl_module
from collections.abc import AsyncIterator, Iterator, Sequence
from typing import Any

from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.base import (
    BaseCheckpointSaver,
    ChannelVersions,
    Checkpoint,
    CheckpointMetadata,
    CheckpointTuple,
)

from backend.config import settings

logger = logging.getLogger(__name__)

_checkpointer = None


def _mysql_checkpointer_connection():
    import pymysql

    ssl_kwargs = {}
    if not settings.MYSQL_SSL_VERIFY_CERT:
        ssl_kwargs["cert_reqs"] = ssl_module.CERT_NONE
    if settings.MYSQL_SSL_CA:
        ssl_kwargs["ca"] = settings.MYSQL_SSL_CA

    return pymysql.connect(
        host=settings.MYSQL_HOST,
        port=settings.MYSQL_PORT,
        user=settings.MYSQL_USER,
        password=settings.MYSQL_PASSWORD,
        database=settings.MYSQL_DATABASE,
        ssl=ssl_kwargs if ssl_kwargs else None,
        autocommit=True,
    )


def _legacy_py_mysql_checkpoint_schema(conn) -> bool:
    with conn.cursor() as cur:
        cur.execute("SHOW TABLES LIKE 'checkpoints'")
        if not cur.fetchone():
            return False
        cur.execute(
            """
            SELECT COUNT(*) FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'checkpoints'
              AND column_name = 'checkpoint_ns_hash'
            """
        )
        return cur.fetchone()[0] == 0


def _reset_checkpoint_tables(conn) -> None:
    for table in ("checkpoint_writes", "checkpoint_blobs", "checkpoints", "checkpoint_migrations"):
        with conn.cursor() as cur:
            cur.execute(f"DROP TABLE IF EXISTS `{table}`")


_TIDB_SHALLOW_CHECKPOINT_DDL = (
    """CREATE TABLE IF NOT EXISTS checkpoint_migrations (
    v INTEGER PRIMARY KEY
);""",
    """CREATE TABLE IF NOT EXISTS checkpoints (
    thread_id VARCHAR(150) NOT NULL,
    checkpoint_ns VARCHAR(2000) NOT NULL DEFAULT '',
    checkpoint_ns_hash BINARY(16) NOT NULL,
    type VARCHAR(150),
    checkpoint JSON NOT NULL,
    metadata JSON NOT NULL,
    PRIMARY KEY (thread_id, checkpoint_ns_hash)
);""",
    """CREATE TABLE IF NOT EXISTS checkpoint_blobs (
    thread_id VARCHAR(150) NOT NULL,
    checkpoint_ns VARCHAR(2000) NOT NULL DEFAULT '',
    checkpoint_ns_hash BINARY(16) NOT NULL,
    channel VARCHAR(150) NOT NULL,
    type VARCHAR(150) NOT NULL,
    `blob` LONGBLOB,
    PRIMARY KEY (thread_id, checkpoint_ns_hash, channel)
);""",
    """CREATE TABLE IF NOT EXISTS checkpoint_writes (
    thread_id VARCHAR(150) NOT NULL,
    checkpoint_ns VARCHAR(2000) NOT NULL DEFAULT '',
    checkpoint_ns_hash BINARY(16) NOT NULL,
    checkpoint_id VARCHAR(150) NOT NULL,
    task_id VARCHAR(150) NOT NULL,
    idx INTEGER NOT NULL,
    channel VARCHAR(150) NOT NULL,
    type VARCHAR(150),
    `blob` LONGBLOB NOT NULL,
    task_path VARCHAR(2000) NOT NULL DEFAULT '',
    PRIMARY KEY (thread_id, checkpoint_ns_hash, checkpoint_id, task_id, idx)
);""",
    "CREATE INDEX IF NOT EXISTS checkpoints_thread_id_idx ON checkpoints (thread_id);",
    "CREATE INDEX IF NOT EXISTS checkpoint_blobs_thread_id_idx ON checkpoint_blobs (thread_id);",
    "CREATE INDEX IF NOT EXISTS checkpoint_writes_thread_id_idx ON checkpoint_writes (thread_id);",
)


def _setup_tidb_shallow_checkpoint_tables(conn) -> None:
    from langgraph.checkpoint.mysql.shallow import MIGRATIONS

    with conn.cursor() as cur:
        for statement in _TIDB_SHALLOW_CHECKPOINT_DDL:
            cur.execute(statement)
        for version in range(len(MIGRATIONS)):
            cur.execute("INSERT IGNORE INTO checkpoint_migrations (v) VALUES (%s)", (version,))


class AsyncShallowPyMySQLSaver(BaseCheckpointSaver):
    """Wrap sync ShallowPyMySQLSaver so LangGraph async APIs (astream/ainvoke) work."""

    def __init__(self, saver) -> None:
        super().__init__(serde=saver.serde)
        self._saver = saver

    def setup(self) -> None:
        self._saver.setup()

    def get_tuple(self, config: RunnableConfig) -> CheckpointTuple | None:
        return self._saver.get_tuple(config)

    async def aget_tuple(self, config: RunnableConfig) -> CheckpointTuple | None:
        return await asyncio.to_thread(self._saver.get_tuple, config)

    def put(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: ChannelVersions,
    ) -> RunnableConfig:
        return self._saver.put(config, checkpoint, metadata, new_versions)

    async def aput(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: ChannelVersions,
    ) -> RunnableConfig:
        return await asyncio.to_thread(self._saver.put, config, checkpoint, metadata, new_versions)

    def put_writes(
        self,
        config: RunnableConfig,
        writes: Sequence[tuple[str, Any]],
        task_id: str,
        task_path: str = "",
    ) -> None:
        self._saver.put_writes(config, writes, task_id, task_path)

    async def aput_writes(
        self,
        config: RunnableConfig,
        writes: Sequence[tuple[str, Any]],
        task_id: str,
        task_path: str = "",
    ) -> None:
        await asyncio.to_thread(self._saver.put_writes, config, writes, task_id, task_path)

    def list(
        self,
        config: RunnableConfig | None,
        *,
        filter: dict[str, Any] | None = None,
        before: RunnableConfig | None = None,
        limit: int | None = None,
    ) -> Iterator[CheckpointTuple]:
        yield from self._saver.list(config, filter=filter, before=before, limit=limit)

    async def alist(
        self,
        config: RunnableConfig | None,
        *,
        filter: dict[str, Any] | None = None,
        before: RunnableConfig | None = None,
        limit: int | None = None,
    ) -> AsyncIterator[CheckpointTuple]:
        items = await asyncio.to_thread(
            lambda: list(self._saver.list(config, filter=filter, before=before, limit=limit))
        )
        for item in items:
            yield item

    def delete_thread(self, thread_id: str) -> None:
        if hasattr(self._saver, "delete_thread"):
            self._saver.delete_thread(thread_id)

    async def adelete_thread(self, thread_id: str) -> None:
        if hasattr(self._saver, "delete_thread"):
            await asyncio.to_thread(self._saver.delete_thread, thread_id)


class _AsyncSqliteWrapper(BaseCheckpointSaver):
    """Wrap sync SqliteSaver so LangGraph async APIs work via asyncio.to_thread."""

    def __init__(self, saver) -> None:
        super().__init__(serde=saver.serde)
        self._saver = saver

    def setup(self) -> None:
        self._saver.setup()

    def get_tuple(self, config: RunnableConfig) -> CheckpointTuple | None:
        return self._saver.get_tuple(config)

    async def aget_tuple(self, config: RunnableConfig) -> CheckpointTuple | None:
        return await asyncio.to_thread(self._saver.get_tuple, config)

    def put(self, config: RunnableConfig, checkpoint: Checkpoint, metadata: CheckpointMetadata, new_versions: ChannelVersions) -> RunnableConfig:
        return self._saver.put(config, checkpoint, metadata, new_versions)

    async def aput(self, config: RunnableConfig, checkpoint: Checkpoint, metadata: CheckpointMetadata, new_versions: ChannelVersions) -> RunnableConfig:
        return await asyncio.to_thread(self._saver.put, config, checkpoint, metadata, new_versions)

    def put_writes(self, config: RunnableConfig, writes: Sequence[tuple[str, Any]], task_id: str, task_path: str = "") -> None:
        self._saver.put_writes(config, writes, task_id, task_path)

    async def aput_writes(self, config: RunnableConfig, writes: Sequence[tuple[str, Any]], task_id: str, task_path: str = "") -> None:
        await asyncio.to_thread(self._saver.put_writes, config, writes, task_id, task_path)

    def list(self, config: RunnableConfig | None, *, filter: dict[str, Any] | None = None, before: RunnableConfig | None = None, limit: int | None = None) -> Iterator[CheckpointTuple]:
        yield from self._saver.list(config, filter=filter, before=before, limit=limit)

    async def alist(self, config: RunnableConfig | None, *, filter: dict[str, Any] | None = None, before: RunnableConfig | None = None, limit: int | None = None) -> AsyncIterator[CheckpointTuple]:
        items = await asyncio.to_thread(lambda: list(self._saver.list(config, filter=filter, before=before, limit=limit)))
        for item in items:
            yield item


def _probe_mysql_checkpointer(saver) -> bool:
    """Return False when TiDB cannot run ShallowPyMySQLSaver read queries (e.g. JSON_TABLE)."""
    try:
        saver.get_tuple({"configurable": {"thread_id": "__tidb_probe__"}})
        return True
    except Exception as exc:
        logger.warning("MySQL checkpoint reads unavailable on this database (%s).", exc)
        return False


def _build_checkpointer():
    import os
    from langgraph.checkpoint.memory import InMemorySaver

    try:
        from langgraph.checkpoint.sqlite import SqliteSaver

        db_path = settings.CHECKPOINT_DB_PATH
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        conn = __import__("sqlite3").connect(db_path, check_same_thread=False)
        saver = SqliteSaver(conn)
        saver.setup()
        checkpointer = _AsyncSqliteWrapper(saver)
        logger.info("Using SQLite checkpointer at %s.", db_path)
        return checkpointer
    except Exception as exc:
        logger.warning("Failed to initialize SQLite checkpointer (%s), falling back to InMemorySaver.", exc)
        return InMemorySaver()


def get_checkpointer():
    global _checkpointer
    if _checkpointer is None:
        _checkpointer = _build_checkpointer()
    return _checkpointer
