#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Bootstrap HerbChain locally on Windows without GNU make.

.DESCRIPTION
    1. Installs pip + npm deps for backend, website, and mobile (skippable with -SkipInstall).
    2. Applies Alembic migrations to the SQLite DB.
    3. Seeds 6 demo users + 3 demo batches.
    4. Optionally starts the Flask backend (skippable with -SkipBackend).

    Run the website and mobile dev servers in separate terminals afterwards:
        cd website && npm run dev
        cd App     && npx expo start

.EXAMPLE
    ./scripts/demo.ps1
    ./scripts/demo.ps1 -SkipInstall            # if you've already installed deps
    ./scripts/demo.ps1 -SkipBackend            # just refresh data, don't start the API
#>
[CmdletBinding()]
param(
    [switch]$SkipInstall,
    [switch]$SkipBackend
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

Write-Host "==> HerbChain demo bootstrap" -ForegroundColor Cyan
Write-Host "    repo: $repoRoot"

if (-not $SkipInstall) {
    Write-Host "`n==> Installing Python deps (backend/)" -ForegroundColor Cyan
    Push-Location backend
    python -m pip install -r requirements.txt
    Pop-Location

    Write-Host "`n==> Installing JS deps (website/)" -ForegroundColor Cyan
    Push-Location website
    npm install
    Pop-Location

    Write-Host "`n==> Installing JS deps (App/)" -ForegroundColor Cyan
    Push-Location App
    npm install
    Pop-Location
} else {
    Write-Host "Skipping installs (-SkipInstall)." -ForegroundColor Yellow
}

Write-Host "`n==> Applying migrations" -ForegroundColor Cyan
Push-Location backend\server
try {
    python -m flask --app app db upgrade
} catch {
    Write-Host "flask db upgrade failed — falling back to db.create_all() via seed script." -ForegroundColor Yellow
}
Pop-Location

Write-Host "`n==> Seeding demo data" -ForegroundColor Cyan
Push-Location backend\server
python scripts\seed_demo.py --fresh
Pop-Location

Write-Host "`nDemo data ready. Credentials:" -ForegroundColor Green
Write-Host "  farmer1@herbchain.local      / farmerpass     (farmer)"
Write-Host "  transporter1@herbchain.local / transpass      (transporter)"
Write-Host "  lab1@herbchain.local         / labpass        (lab)"
Write-Host "  manufacturer1@herbchain.local/ mfgpass        (manufacturer)"
Write-Host "  consumer1@herbchain.local    / conspass       (consumer)"
Write-Host "  admin@herbchain.local        / adminpass      (admin)"

if ($SkipBackend) {
    Write-Host "`nDone. Start the backend manually with:" -ForegroundColor Cyan
    Write-Host "  cd backend\server; python -m flask --app app run --host 0.0.0.0 --port 5000"
    exit 0
}

Write-Host "`n==> Starting backend on http://localhost:5000 (Ctrl+C to stop)" -ForegroundColor Cyan
Push-Location backend\server
python -m flask --app app run --host 0.0.0.0 --port 5000
Pop-Location
