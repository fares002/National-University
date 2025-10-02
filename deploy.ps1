# Deployment Script for National University System
# This script pulls latest code from GitHub and redeploys the application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Deployment Process" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

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
docker-compose down
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Warning: Failed to stop containers (they may not be running)" -ForegroundColor Yellow
}
Write-Host "✅ Containers stopped" -ForegroundColor Green
Write-Host ""

# Step 3: Build Docker images
Write-Host "Step 3: Building Docker images..." -ForegroundColor Yellow
Write-Host "Purpose: Compile the latest code into Docker containers (uses cache for speed)" -ForegroundColor Gray
docker-compose build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build Docker images" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker images built successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Run database migrations
Write-Host "Step 4: Running database migrations..." -ForegroundColor Yellow
Write-Host "Purpose: Update database schema if there are any changes" -ForegroundColor Gray
Set-Location "National-Universty-Backend"
# Check if there are pending migrations
$migrationStatus = npx prisma migrate status
if ($migrationStatus -match "Database schema is up to date") {
    Write-Host "✅ No migrations needed - database is up to date" -ForegroundColor Green
} else {
    npx prisma migrate deploy
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to run migrations" -ForegroundColor Red
        Set-Location ".."
        exit 1
    }
    Write-Host "✅ Database migrations completed" -ForegroundColor Green
}
Set-Location ".."
Write-Host ""

# Step 5: Start containers
Write-Host "Step 5: Starting containers..." -ForegroundColor Yellow
Write-Host "Purpose: Launch all services with the new code" -ForegroundColor Gray
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start containers" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Containers started successfully" -ForegroundColor Green
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
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
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
