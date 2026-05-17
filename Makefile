PYTHON ?= python3.13
VENV ?= .venv313

.PHONY: venv install preflight test-cloud backend frontend smoke-chat test-triage

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

backend:
	$(VENV)/bin/uvicorn backend.api.main:app --host 0.0.0.0 --port 8000

frontend:
	cd frontend && npm install && npm run dev

smoke-chat:
	bash scripts/smoke_chat.sh

test-triage:
	$(VENV)/bin/python scripts/test_triage_heuristic.py
