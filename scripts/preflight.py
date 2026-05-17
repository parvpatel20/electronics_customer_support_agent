from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

REQUIRED_PYTHON_MIN = (3, 11)
REQUIRED_PYTHON_MAX_EXCLUSIVE = (3, 14)

REQUIRED_ENV = [
    "GROQ_API_KEY",
    "HF_TOKEN",
    "PINECONE_API_KEY",
    "MYSQL_HOST",
    "MYSQL_PORT",
    "MYSQL_USER",
    "MYSQL_PASSWORD",
    "MYSQL_DATABASE",
    "PHOENIX_COLLECTOR_ENDPOINT",
    "PHOENIX_API_KEY",
    "PHOENIX_PROJECT_NAME",
]

REQUIRED_MODULES = [
    "fastapi",
    "uvicorn",
    "pydantic",
    "pymysql",
    "langchain",
    "langgraph",
    "langchain_groq",
    "langchain_huggingface",
    "langchain_pinecone",
    "pinecone",
    "phoenix.otel",
]


def version_ok() -> bool:
    return REQUIRED_PYTHON_MIN <= sys.version_info[:2] < REQUIRED_PYTHON_MAX_EXCLUSIVE


def main() -> int:
    from backend.config import settings

    print(f"Python: {sys.version.split()[0]}")
    if not version_ok():
        print("Unsupported Python version. Use Python >=3.11,<3.14. Recommended local command: python3.13 -m venv .venv313")
        return 1

    missing_modules = [module for module in REQUIRED_MODULES if importlib.util.find_spec(module) is None]
    if missing_modules:
        print("Missing Python modules:")
        for module in missing_modules:
            print(f"- {module}")
        print("Install with: python3.13 -m pip install -r requirements.txt")
        return 1

    missing_env = [name for name in REQUIRED_ENV if not getattr(settings, name, None)]
    if missing_env:
        print("Missing environment variables:")
        for name in missing_env:
            print(f"- {name}")
        print("Load .env before running locally, or use Docker Compose env_file support.")
        return 1

    print("Preflight passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
