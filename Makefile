PYTHON ?= python3.13
VENV ?= .venv313

.PHONY: venv install preflight test-cloud schema seed reset-hitl backend backend-prod frontend frontend-build smoke-chat test-triage docker-build docker-up docker-down clean

venv:
	$(PYTHON) -m venv $(VENV)
	$(VENV)/bin/python -m pip install --upgrade pip setuptools wheel

install: venv
	$(VENV)/bin/pip install -r requirements.txt

preflight:
	$(VENV)/bin/python scripts/preflight.py

test-cloud:
	$(VENV)/bin/python scripts/test_tidb_connection.py
	$(VENV)/bin/python scripts/test_phoenix_connection.py

schema:
	$(VENV)/bin/python scripts/init_tidb_schema.py

seed:
	$(VENV)/bin/python scripts/seed_demo.py

reset-hitl:
	docker compose exec backend python3 scripts/reset_hitl.py

backend:
	$(VENV)/bin/uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload

backend-prod:
	$(VENV)/bin/uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --workers 2

frontend:
	cd frontend && npm install && npm run dev

frontend-build:
	cd frontend && npm install && npm run build

smoke-chat:
	bash scripts/smoke_chat.sh

test-triage:
	$(VENV)/bin/python scripts/test_triage_heuristic.py

docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

clean:
	find . -name __pycache__ -type d -not -path './$(VENV)/*' -prune -exec rm -rf {} +
	find . -name '*.pyc' -not -path './$(VENV)/*' -delete
