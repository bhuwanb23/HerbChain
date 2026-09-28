#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Bootstrap HerbChain locally on Windows without GNU make.

.DESCRIPTION
    1. Installs npm deps for backend, website, and mobile (skippable with -SkipInstall).
    2. Generates the Prisma client and applies committed migrations.
    3. Seeds demo users, RBAC, and the 25-species AYUSH catalogue.
    4. Optionally starts the backend (skippable with -SkipBackend).

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
    Write-Host "`n==> Installing JS deps (backend/)" -ForegroundColor Cyan
    Push-Location backend
    npm install
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

Write-Host "`n==> Generating Prisma client + applying migrations" -ForegroundColor Cyan
Push-Location backend
npm run generate
npm run migrate
Pop-Location

Write-Host "`n==> Seeding demo data" -ForegroundColor Cyan
Push-Location backend
npm run seed
Pop-Location

Write-Host "`nDemo data ready. Credentials:" -ForegroundColor Green
Write-Host "  admin@herbchain.in          / Admin@123456  (admin)"
Write-Host "  farmer@herbchain.in         / Demo@123456   (farmer)"
Write-Host "  transporter@herbchain.in    / Demo@123456   (transporter)"
Write-Host "  lab@herbchain.in            / Demo@123456   (lab)"
Write-Host "  manufacturer@herbchain.in   / Demo@123456   (manufacturer)"
Write-Host "  distributor@herbchain.in    / Demo@123456   (distributor)"
Write-Host "  retailer@herbchain.in       / Demo@123456   (retailer)"
Write-Host "  consumer@herbchain.in       / Demo@123456   (consumer)"

Write-Host "`nNext terminals:" -ForegroundColor Cyan
Write-Host "  cd website; npm run dev      # http://localhost:5173"
Write-Host "  cd App;     npx expo start   # scan with Expo Go"

if ($SkipBackend) {
    Write-Host "`nDone. Start the backend manually with:" -ForegroundColor Cyan
    Write-Host "  cd backend; npm run dev"
    exit 0
}

Write-Host "`n==> Starting backend on http://localhost:5000 (Ctrl+C to stop)" -ForegroundColor Cyan
Push-Location backend
npm run dev
Pop-Location
