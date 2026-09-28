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
  echo "==> Installing JS deps (backend/)"
  (cd backend && npm install)
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
echo "==> Generating Prisma client + applying migrations"
(cd backend && npm run generate && npm run migrate)

echo
echo "==> Seeding demo data (users, RBAC, 25-species AYUSH catalogue)"
(cd backend && npm run seed)

echo
echo "Demo data ready. Credentials:"
echo "  admin@herbchain.in          / Admin@123456  (admin)"
echo "  farmer@herbchain.in         / Demo@123456   (farmer)"
echo "  transporter@herbchain.in    / Demo@123456   (transporter)"
echo "  lab@herbchain.in            / Demo@123456   (lab)"
echo "  manufacturer@herbchain.in   / Demo@123456   (manufacturer)"
echo "  distributor@herbchain.in    / Demo@123456   (distributor)"
echo "  retailer@herbchain.in       / Demo@123456   (retailer)"
echo "  consumer@herbchain.in       / Demo@123456   (consumer)"

echo
echo "Next terminals:"
echo "  cd website && npm run dev      # http://localhost:5173"
echo "  cd App && npx expo start       # scan with Expo Go"

if [ "$SKIP_BACKEND" -eq 1 ]; then
  echo
  echo "Done. Start the backend manually with:"
  echo "  cd backend && npm run dev"
  exit 0
fi

echo
echo "==> Starting backend on http://localhost:5000 (Ctrl+C to stop)"
cd backend && exec npm run dev
