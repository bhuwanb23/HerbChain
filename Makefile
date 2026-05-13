# HerbChain repo-wide tasks.
#
# Usage:
#   make demo         install + migrate + seed + run backend (the headline target)
#   make install      pip + npm installs for backend, website, mobile
#   make migrate      apply Alembic migrations to the SQLite DB
#   make seed         (re-)seed the demo dataset
#   make run-backend  start the Flask API on :5000
#   make run-website  start the Vite dev server on :5173
#   make run-app      start the Expo dev server
#   make test         run the backend pytest suite
#
# Cross-platform notes:
# - On Windows, use Git Bash or msys2 so `make` is available, or run the
#   equivalent commands in `scripts/demo.ps1`.
# - Python entrypoint is `python` (works on both Windows and Linux); change to
#   `python3` if your system needs it.

PYTHON ?= python
PIP    ?= pip
NPM    ?= npm

.PHONY: demo install install-backend install-website install-app \
        migrate seed run-backend run-website run-app test \
        clean archive-legacy

demo: install migrate seed run-backend

install: install-backend install-website install-app

install-backend:
	cd backend && $(PIP) install -r requirements.txt

install-website:
	cd website && $(NPM) install

install-app:
	cd App && $(NPM) install

migrate:
	cd backend/server && $(PYTHON) -m flask --app app db upgrade

seed:
	cd backend/server && $(PYTHON) scripts/seed_demo.py --fresh

run-backend:
	cd backend/server && $(PYTHON) -m flask --app app run --host 0.0.0.0 --port 5000

run-website:
	cd website && $(NPM) run dev

run-app:
	cd App && $(NPM) start

test:
	cd backend && $(PYTHON) -m pytest

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true

# Move the unused prototype + blockchain scaffolds out of the active workspace.
# Safe to re-run; uses `git mv` so history is preserved.
archive-legacy:
	@mkdir -p _archive
	@if [ -d prototype ];           then git mv prototype _archive/prototype           || mv prototype _archive/prototype           ; fi
	@if [ -d backend/blockchain ];  then git mv backend/blockchain _archive/blockchain || mv backend/blockchain _archive/blockchain ; fi
