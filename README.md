# TechCart AI

Electronics and gadgets customer support system built with FastAPI, LangChain `create_agent`, LangGraph, Groq, HuggingFace embeddings, Pinecone, MySQL, Phoenix, React, and Tailwind.

## Services

- Backend API: `http://localhost:8000`
- Frontend dev server: `http://localhost:5173`
- Phoenix traces: configured by `PHOENIX_BASE_URL`
- MySQL-compatible database: TiDB Cloud via PyMySQL

## Required Keys

Copy `.env.example` to `.env` and fill:

- `GROQ_API_KEY`
- `HF_TOKEN`
- `PINECONE_API_KEY`
- TiDB Cloud `MYSQL_*` values
- Phoenix Cloud `PHOENIX_*` values

For local development, use a TiDB Cloud public endpoint. A `privatelink` hostname usually only resolves from the configured AWS/VPC/private network.

For Phoenix Cloud spaces, set:

```bash
PHOENIX_BASE_URL=https://app.phoenix.arize.com/s/<space>
PHOENIX_COLLECTOR_ENDPOINT=https://app.phoenix.arize.com/s/<space>/v1/traces
PHOENIX_API_KEY=<key>
```

If your Phoenix Cloud space requires the legacy header path, also set:

```bash
PHOENIX_CLIENT_HEADERS=api_key=<key>
```

## Python Version

Use Python `>=3.11,<3.14`. Python `3.14` is not supported because `langchain-pinecone` currently publishes `Requires-Python: >=3.9,<3.14`.

Recommended local setup on this machine:

```bash
python3.13 -m venv .venv313
.venv313/bin/python -m pip install --upgrade pip setuptools wheel
.venv313/bin/pip install -r requirements.txt
```

Or use:

```bash
make install
```

## Run Backend Stack

```bash
cp .env.example .env
docker compose up --build
```

Docker Compose runs the backend only. TiDB Cloud and Phoenix Cloud are external services configured in `.env`.

## Debug Cloud Connections

```bash
.venv313/bin/python scripts/preflight.py
.venv313/bin/python scripts/test_tidb_connection.py
.venv313/bin/python scripts/test_phoenix_connection.py
```

## Initialize TiDB Schema

```bash
.venv313/bin/python scripts/init_tidb_schema.py
```

## Ingest Manuals

After the backend dependencies are installed and `.env` is populated:

```bash
python -m backend.rag.ingestor
```

Manuals go in `data/product_manuals/`. The sample router manual is included.

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

## API

- `POST /chat`: streams support responses as SSE frames.
- `GET /conversations/{customer_id}`: returns recent conversations.
- `GET /admin/metrics`: admin metrics, requires `X-Admin-Password`.
- `POST /admin/approve-refund/{conversation_id}`: resumes a paused refund approval.
- `GET /admin/traces`: returns Phoenix trace UI location.

## Architecture Notes

- Embeddings use `HuggingFaceEndpointEmbeddings` from `langchain-huggingface` with `BAAI/bge-m3`.
- Agents use `ChatGroq` from `langchain-groq`.
- Middleware uses LangChain built-ins for summarization, human approval, PII redaction, tool selection, and tool-call limits.
- TiDB Cloud stores customers, orders, invoices, conversations, messages, returns, token usage, and evaluation logs through the PyMySQL client.
- Pinecone uses the configured `dev` or `prod` namespace based on `ENV`.
