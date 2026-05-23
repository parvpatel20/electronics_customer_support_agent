from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    GROQ_API_KEY: str = ""
    HF_TOKEN: str = ""
    PINECONE_API_KEY: str = ""

    ENV: Literal["dev", "prod"] = "dev"
    LOG_LEVEL: str = "INFO"

    PINECONE_INDEX_NAME: str = "techcart-support"
    PINECONE_NAMESPACE_DEV: str = "dev"
    PINECONE_NAMESPACE_PROD: str = "prod"
    PINECONE_CLOUD: str = "aws"
    PINECONE_REGION: str = "us-east-1"

    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_USER: str = "techcart"
    MYSQL_PASSWORD: str = ""
    MYSQL_DATABASE: str = "techcart"
    MYSQL_SSL_VERIFY_CERT: bool = False
    MYSQL_SSL_VERIFY_IDENTITY: bool = False
    MYSQL_SSL_CA: str = ""

    PHOENIX_PORT: int = 6006
    PHOENIX_BASE_URL: str = "http://localhost:6006"
    PHOENIX_COLLECTOR_ENDPOINT: str = "http://localhost:4317"
    PHOENIX_API_KEY: str = ""
    PHOENIX_CLIENT_HEADERS: str = ""
    PHOENIX_PROJECT_NAME: str = "techcart-support"

    PRIMARY_MODEL: str = "llama-3.3-70b-versatile"
    FAST_MODEL: str = "llama-3.1-8b-instant"
    HF_EMBEDDING_MODEL: str = "BAAI/bge-m3"
    EMBEDDING_DIMENSION: int = 1024

    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:5173"
    ADMIN_PASSWORD: str = ""

    CHECKPOINT_DB_PATH: str = "/app/checkpoints/langgraph.db"

    CHAT_CONTEXT_MESSAGE_LIMIT: int = 8
    CHAT_STORED_MESSAGE_LIMIT: int = 20
    CHAT_HISTORY_MESSAGE_LIMIT: int = 20
    GRAPH_RECURSION_LIMIT: int = 25
    BILLING_RECURSION_LIMIT: int = 100
    AGENT_MESSAGE_LIMIT: int = 12

    PRODUCT_MANUALS_DIR: Path = Field(default=Path("data/product_manuals"))

    @field_validator("LOG_LEVEL")
    @classmethod
    def _normalize_log_level(cls, value: str) -> str:
        candidate = (value or "INFO").upper()
        if candidate not in {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}:
            return "INFO"
        return candidate

    @property
    def pinecone_namespace(self) -> str:
        return self.PINECONE_NAMESPACE_PROD if self.ENV == "prod" else self.PINECONE_NAMESPACE_DEV

    @property
    def ticket_namespace(self) -> str:
        return f"tickets:{self.pinecone_namespace}"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def has_pinecone(self) -> bool:
        return bool(self.PINECONE_API_KEY and self.HF_TOKEN)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
