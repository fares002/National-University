# Deployment Script
Set-Location "C:\Users\freem\National-University"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Deployment..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

git config --global --add safe.directory C:/Users/freem/National-University

Write-Host "`nStep 1: Pulling latest code..." -ForegroundColor Yellow
git fetch origin
git pull origin main
Write-Host "✅ Code updated" -ForegroundColor Green

Write-Host "`nStep 2: Stopping containers..." -ForegroundColor Yellow
docker-compose down
Write-Host "✅ Containers stopped" -ForegroundColor Green

Write-Host "`nStep 3: Building images..." -ForegroundColor Yellow
# BuildKit should work with direct docker build commands
$env:DOCKER_BUILDKIT=1

# Build backend image directly with docker (using cache)
Write-Host "  Building backend..." -ForegroundColor Gray
docker build --pull=false -t national-university-backend:latest "C:\Users\freem\National-University\National-Universty-Backend"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed!" -ForegroundColor Red
    exit 1
}

# Build frontend image directly with docker (using cache)
Write-Host "  Building frontend..." -ForegroundColor Gray
docker build --pull=false -t national-university-frontend:latest "C:\Users\freem\National-University\sudani-fin-flow"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Images built successfully" -ForegroundColor Green

Write-Host "`nStep 4: Starting containers..." -ForegroundColor Yellow
docker-compose up -d
Write-Host "✅ Containers started" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🚀 Deployment complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
