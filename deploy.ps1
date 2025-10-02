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
$env:DOCKER_BUILDKIT=0

# Build backend image from within its directory
Write-Host "  Building backend..." -ForegroundColor Gray
Push-Location "National-Universty-Backend"
docker build --pull=false -t national-university-backend:latest .
$backendResult = $LASTEXITCODE
Pop-Location
if ($backendResult -ne 0) {
    Write-Host "❌ Backend build failed!" -ForegroundColor Red
    exit 1
}

# Build frontend image from within its directory
Write-Host "  Building frontend..." -ForegroundColor Gray
Push-Location "sudani-fin-flow"
docker build --pull=false -t national-university-frontend:latest .
$frontendResult = $LASTEXITCODE
Pop-Location
if ($frontendResult -ne 0) {
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
