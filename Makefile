# HerbChain repo-wide tasks (Node backend).
#
# Usage:
#   make demo         install + migrate + seed + run backend (the headline target)
#   make install      npm installs for backend, website, mobile
#   make migrate      apply committed Prisma migrations to the SQLite DB
#   make seed         (re-)seed the demo dataset
#   make run-backend  start the API on :5000 (node --watch)
#   make run-website  start the Vite dev server on :5173
#   make run-app      start the Expo dev server
#   make test         run the backend test suite (builds the template DB if missing)
#   make template-db  (re)build the empty test template DB
#   make clean        remove caches and local DB state
#
# Windows without make: use scripts/demo.ps1 for the demo flow.

NPM ?= npm

.PHONY: demo install install-backend install-website install-app \
        migrate seed template-db run-backend run-website run-app test clean

demo: install migrate seed run-backend

install: install-backend install-website install-app

install-backend:
	cd backend && $(NPM) install

install-website:
	cd website && $(NPM) install

install-app:
	cd App && $(NPM) install

migrate:
	cd backend && $(NPM) run generate && $(NPM) run migrate

seed:
	cd backend && $(NPM) run seed

# Empty template DB copied per-suite by backend/tests/_db.js (local only).
template-db:
	cd backend && $(NPM) run generate && $(NPM) run migrate && node scripts/create-test-template.mjs

run-backend:
	cd backend && $(NPM) run dev

run-website:
	cd website && $(NPM) run dev

run-app:
	cd App && $(NPM) start

test: template-db
	cd backend && $(NPM) test

clean:
	rm -rf backend/.testdb backend/.tmp backend/logs backend/uploads
	rm -rf website/dist website/node_modules/.vite
