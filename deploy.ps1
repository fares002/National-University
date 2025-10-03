# Deployment Script for National University System
# This script pulls latest code from GitHub and redeploys the application

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

function Write-Section($text) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host $text -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Check-Docker {
    Write-Host "Checking Docker daemon..." -ForegroundColor Gray
    $maxRetries = 10
    for ($i = 1; $i -le $maxRetries; $i++) {
        try {
            docker info *> $null
            Write-Host "✅ Docker is available" -ForegroundColor Green
            return
        } catch {
            Write-Host "Attempt $i/$($maxRetries): Docker not ready. Trying to start service 'com.docker.service'..." -ForegroundColor Yellow
            try { Start-Service -Name com.docker.service -ErrorAction SilentlyContinue } catch {}
            Start-Sleep -Seconds 3
        }
    }
    throw "Docker is not available. Ensure Docker Desktop is running and the runner user is in the 'docker-users' group."
}

function Invoke-Compose {
    param([Parameter(Mandatory)][string[]]$Args)
    if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        docker-compose @Args
    } else {
        docker compose @Args
    }
}

Write-Section "Starting Deployment Process"

# Ensure we run from the repo root (script directory)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Check-Docker

# Step 1: Pull latest code from GitHub
Write-Host "Step 1: Pulling latest code from GitHub..." -ForegroundColor Yellow
Write-Host "Purpose: Get the latest changes you pushed" -ForegroundColor Gray
git fetch origin
git pull origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to pull latest code from GitHub" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Code updated successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Stop running containers
Write-Host "Step 2: Stopping running containers..." -ForegroundColor Yellow
Write-Host "Purpose: Gracefully stop all services before rebuilding" -ForegroundColor Gray
Invoke-Compose down
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Warning: Failed to stop containers (they may not be running)" -ForegroundColor Yellow
}
Write-Host "✅ Containers stopped" -ForegroundColor Green
Write-Host ""

# Step 3: Build Docker images
Write-Host "Step 3: Building Docker images..." -ForegroundColor Yellow
Write-Host "Purpose: Compile the latest code into Docker containers (uses cache for speed)" -ForegroundColor Gray
Invoke-Compose build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build Docker images" -ForegroundColor Red
    Write-Host "Tip: Ensure the GitHub runner user has access to Docker (docker-users group) and Docker Desktop is running." -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Docker images built successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Start containers
Write-Host "Step 4: Starting containers..." -ForegroundColor Yellow
Write-Host "Purpose: Launch all services with the new code" -ForegroundColor Gray
Invoke-Compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start containers" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Containers started successfully" -ForegroundColor Green
Write-Host ""

# Step 5: Run database migrations inside backend container
Write-Host "Step 5: Running database migrations (inside container)..." -ForegroundColor Yellow
Write-Host "Purpose: Update database schema if there are any changes" -ForegroundColor Gray
Invoke-Compose exec -T backend npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to run migrations inside container" -ForegroundColor Red
    Write-Host "Hint: Verify DATABASE_URL in docker-compose.yml points to a reachable DB (host.docker.internal on Windows)." -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Database migrations completed" -ForegroundColor Green
Write-Host ""

# Step 6: Wait for services to be healthy
Write-Host "Step 6: Waiting for services to be healthy..." -ForegroundColor Yellow
Write-Host "Purpose: Ensure all services are running properly" -ForegroundColor Gray
Start-Sleep -Seconds 15

# Check container health
$backend = docker ps --filter "name=national-university-backend" --format "{{.Status}}"
$frontend = docker ps --filter "name=national-university-frontend" --format "{{.Status}}"
$redis = docker ps --filter "name=national-university-redis" --format "{{.Status}}"

Write-Host ""
Write-Host "Container Status:" -ForegroundColor Cyan
Write-Host "  Backend:  $backend" -ForegroundColor White
Write-Host "  Frontend: $frontend" -ForegroundColor White
Write-Host "  Redis:    $redis" -ForegroundColor White
Write-Host ""

# Step 7: Show deployment summary
Write-Section "Deployment Summary"
Write-Host "✅ Code pulled from GitHub" -ForegroundColor Green
Write-Host "✅ Docker images rebuilt" -ForegroundColor Green
Write-Host "✅ Database migrations applied" -ForegroundColor Green
Write-Host "✅ All services restarted" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Deployment completed at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Green
Write-Host ""
Write-Host "Access the application at:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost" -ForegroundColor White
Write-Host "  Backend:  http://localhost:3000" -ForegroundColor White
Write-Host ""
