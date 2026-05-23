# TechCart AI

Production-ready electronics customer support system: multi-agent FastAPI backend (LangChain `create_agent` + LangGraph) with a React/Tailwind UI. Uses Groq for LLM inference, HuggingFace BGE-M3 for embeddings, Pinecone for vector search, TiDB Cloud (MySQL-compatible) for state, and Arize Phoenix for tracing.

## Architecture

```
Frontend (Vite + React)
   │
   ▼
FastAPI (SSE chat, HITL approval, admin metrics, health/ready)
   │
   ├─► LangGraph supervisor → {triage, billing, technical, returns, supervisor, human}
   │       │
   │       ├─► Tools: lookup_order, get_delivery_status, initiate_return,
   │       │          get_return_status, get_invoice_details,
   │       │          check_refund_eligibility, process_refund,
   │       │          update_payment_dispute, get_order_product_context,
   │       │          search_product_docs, get_product_specs,
   │       │          check_warranty_status, get_compatibility_info
   │       │
   │       └─► Middleware: PII redaction, tool-call limits, summarization,
   │                       human-in-the-loop refund approval, token tracking
   │
   ├─► TiDB Cloud (customers, orders, invoices, returns, conversations,
   │              messages, token_usage_logs, evaluation_logs)
   │
   ├─► Pinecone (RAG: product manuals + ticket memory)
   │
   └─► Phoenix Cloud (OpenTelemetry tracing)
```

## Services & URLs

| Service          | URL                                      |
|------------------|------------------------------------------|
| Backend API      | http://localhost:8000                    |
| Frontend         | http://localhost:5173                    |
| Health check     | http://localhost:8000/health             |
| Readiness check  | http://localhost:8000/ready              |
| Phoenix traces   | configured via `PHOENIX_BASE_URL`        |

## Prerequisites

- Python `>=3.11,<3.14` (3.13 recommended — `langchain-pinecone` does not yet support 3.14)
- Node 20+
- A TiDB Cloud cluster (public endpoint), Phoenix Cloud space, Groq API key, HuggingFace token, Pinecone API key

## Configuration

Copy `.env.example` to `.env` and fill in:

```
GROQ_API_KEY=...
HF_TOKEN=...
PINECONE_API_KEY=...
MYSQL_HOST=gateway01.<region>.prod.aws.tidbcloud.com
MYSQL_PORT=4000
MYSQL_USER=...
MYSQL_PASSWORD=...
MYSQL_DATABASE=techcart
PHOENIX_BASE_URL=https://app.phoenix.arize.com/s/<space>
PHOENIX_COLLECTOR_ENDPOINT=https://app.phoenix.arize.com/s/<space>/v1/traces
PHOENIX_API_KEY=...
ADMIN_PASSWORD=...
```

For a TiDB Cloud public endpoint, leave `MYSQL_SSL_VERIFY_CERT=false`. For a `privatelink` host, connect from an AWS VPC and set `MYSQL_SSL_CA` if your network policy needs strict TLS.

The frontend reads `VITE_API_BASE` from `frontend/.env` (defaults to `http://localhost:8000`).

## Quick Start (Local)

```bash
make install                # creates .venv313 and installs requirements
make preflight              # validates Python version, modules, and env
make seed                   # applies schema, seeds dummy data, ingests RAG manuals
make backend                # runs FastAPI with reload on :8000
# in another shell:
make frontend               # runs Vite dev server on :5173
```

A successful `make seed` ingests:

- 8 demo customers (`CUST-IN-001` … `CUST-IN-008`)
- 6 SKUs across networking, GPU, audio, wearables, home theatre, accessories
- 8 orders covering delivered/refundable, shipped/in-transit, out-of-window, disputed-invoice, active-RMA, pending, cancelled, and a clean second-customer refund path
- 7 invoices spanning paid, unpaid, disputed, refunded states
- 1 RMA (in transit)
- Sample resolved conversations + RAG manual/ticket chunks in Pinecone

## Quick Start (Docker)

```bash
cp .env.example .env        # fill in cloud credentials
docker compose up --build   # builds + starts backend
docker compose --profile frontend up --build  # add the frontend dev server
```

The backend image runs as a non-root user and exposes a `/health` HTTP healthcheck.

## API Surface

| Endpoint                                   | Method | Purpose                                  |
|--------------------------------------------|--------|------------------------------------------|
| `/auth/login`                              | POST   | Verify customer id or email              |
| `/chat`                                    | POST   | Stream support response (SSE)            |
| `/chat/approve`                            | POST   | Resume a HITL refund approval (SSE)      |
| `/customers/{customer_id}/support`         | GET    | Recent messages + pending HITL state     |
| `/admin/metrics`                           | GET    | Routing/quality/cost metrics (X-Admin)   |
| `/admin/approve-refund/{conversation_id}`  | POST   | Admin-side HITL resume                   |
| `/admin/traces`                            | GET    | Phoenix project URL                      |
| `/health`                                  | GET    | Liveness                                 |
| `/ready`                                   | GET    | Readiness (DB ping)                      |

Admin endpoints require the `X-Admin-Password` header.

## Production Notes

- All Groq, Pinecone, HuggingFace, and TiDB clients have retry/backoff. The refund tool is wrapped in `HumanInTheLoopMiddleware` so it can never execute without explicit human approval.
- Phoenix tracing is configured in the FastAPI lifespan; failure to reach the collector never blocks request handling.
- Conversation state persists in the LangGraph checkpointer. When TiDB cannot serve the JSON_TABLE reads the checkpointer requires (rare), the API automatically falls back to `InMemorySaver` so the agent still works.
- Logs are unified via `backend.logging_config.configure_logging()` and emit at `LOG_LEVEL` (default `INFO`).
- `make seed` is idempotent. It clears `CUST-IN-%` rows, re-applies the schema, and re-ingests manuals/tickets.

## Operational Commands

```bash
make preflight              # verify env + modules
make test-cloud             # ping TiDB and Phoenix endpoints
make schema                 # apply schema only
make seed                   # full reset of demo dataset
make test-triage            # deterministic triage heuristic regression
make smoke-chat             # SSE smoke tests (assumes backend running)
make backend-prod           # uvicorn with multiple workers
```

## Repo Layout

```
backend/
  api/main.py               FastAPI app, SSE streaming, HITL endpoints
  agents/                   triage + 4 specialist agents
  tools/                    DB-backed tools (billing/returns/technical)
  middleware/               PII, token tracker, tool rate limiter
  memory/                   conversation + long-term history helpers
  graph/                    LangGraph multi-agent orchestration + checkpointer
  rag/                      Pinecone ingest + retrieval
  db/                       PyMySQL client + schema.sql
  observability/            Phoenix OTel setup
  evaluation/               LLM-as-judge
  config.py                 Pydantic settings
  logging_config.py         Unified logging
frontend/
  src/                      React UI (chat, login, admin)
scripts/
  seed_demo.py              Full dummy-data + RAG seed
  init_tidb_schema.py       Schema-only init
  preflight.py              Environment validator
  test_*.py                 Connectivity + triage regression
data/
  product_manuals/          Default RAG docs
  seed_rag_india/           Seed manuals + resolved tickets
```
