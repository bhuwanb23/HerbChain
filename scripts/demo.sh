#!/usr/bin/env bash
# Bootstrap HerbChain locally on Linux/macOS/Git Bash without GNU make.
#
# Usage:
#   ./scripts/demo.sh                  # install + migrate + seed + run backend
#   ./scripts/demo.sh --skip-install   # already installed deps; just refresh data
#   ./scripts/demo.sh --skip-backend   # refresh data, don't start API
set -euo pipefail

SKIP_INSTALL=0
SKIP_BACKEND=0
for arg in "$@"; do
  case $arg in
    --skip-install) SKIP_INSTALL=1 ;;
    --skip-backend) SKIP_BACKEND=1 ;;
    *) echo "Unknown arg: $arg"; exit 1 ;;
  esac
done

cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"
echo "==> HerbChain demo bootstrap"
echo "    repo: $REPO_ROOT"

if [ "$SKIP_INSTALL" -eq 0 ]; then
  echo
  echo "==> Installing Python deps (backend/)"
  (cd backend && python -m pip install -r requirements.txt)
  echo
  echo "==> Installing JS deps (website/)"
  (cd website && npm install)
  echo
  echo "==> Installing JS deps (App/)"
  (cd App && npm install)
else
  echo "Skipping installs (--skip-install)."
fi

echo
echo "==> Applying migrations"
(cd backend/server && python -m flask --app app db upgrade) || \
  echo "flask db upgrade failed — seed script will create tables via db.create_all()."

echo
echo "==> Seeding demo data"
(cd backend/server && python scripts/seed_demo.py --fresh)

echo
echo "Demo data ready. Credentials:"
echo "  farmer1@herbchain.local      / farmerpass     (farmer)"
echo "  transporter1@herbchain.local / transpass      (transporter)"
echo "  lab1@herbchain.local         / labpass        (lab)"
echo "  manufacturer1@herbchain.local/ mfgpass        (manufacturer)"
echo "  consumer1@herbchain.local    / conspass       (consumer)"
echo "  admin@herbchain.local        / adminpass      (admin)"

if [ "$SKIP_BACKEND" -eq 1 ]; then
  echo
  echo "Done. Start the backend manually with:"
  echo "  cd backend/server && python -m flask --app app run --host 0.0.0.0 --port 5000"
  exit 0
fi

echo
echo "==> Starting backend on http://localhost:5000 (Ctrl+C to stop)"
exec bash -c "cd backend/server && python -m flask --app app run --host 0.0.0.0 --port 5000"
