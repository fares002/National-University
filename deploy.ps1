# Deployment Script for National University System# Deployment Script for National UniWrite-Host "`nStep 3: Building Docker images..." -ForegroundColor Cyan

# This script pulls latest code from GitHub and redeploys the applicationWrite-Host "Purpose: Compile the latest code into Docker containers (uses cache for speed)" -ForegroundColor Gray

$env:DOCKER_BUILDKIT=0

Write-Host "========================================" -ForegroundColor Cyan$env:COMPOSE_DOCKER_CLI_BUILD=0

Write-Host "Starting Deployment Process" -ForegroundColor CyanPush-Location "C:\Users\freem\National-University"

Write-Host "========================================" -ForegroundColor Cyandocker-compose build

Write-Host ""$buildExitCode = $LASTEXITCODE

Pop-Location

# Configure Git safe directory for NETWORK SERVICEif ($buildExitCode -ne 0) {

Write-Host "Configuring Git safe directory..." -ForegroundColor Yellow    Write-Host "❌ Failed to build Docker images" -ForegroundColor Red

git config --global --add safe.directory C:/Users/freem/National-University    exit 1

Write-Host ""}

Write-Host "✅ Docker images built successfully" -ForegroundColor GreenSystem

# Step 1: Pull latest code from GitHub# This script pulls latest code from GitHub and redeploys the application

Write-Host "Step 1: Pulling latest code from GitHub..." -ForegroundColor Yellow

Write-Host "Purpose: Get the latest changes you pushed" -ForegroundColor GrayWrite-Host "========================================" -ForegroundColor Cyan

Set-Location "C:\Users\freem\National-University"Write-Host "Starting Deployment Process" -ForegroundColor Cyan

git fetch originWrite-Host "========================================" -ForegroundColor Cyan

git pull origin mainWrite-Host ""

if ($LASTEXITCODE -ne 0) {

    Write-Host "❌ Failed to pull latest code from GitHub" -ForegroundColor Red# Configure Git safe directory for NETWORK SERVICE

    exit 1Write-Host "Configuring Git safe directory..." -ForegroundColor Yellow

}git config --global --add safe.directory C:/Users/freem/National-University

Write-Host "✅ Code updated successfully" -ForegroundColor GreenWrite-Host ""

Write-Host ""

# Step 1: Pull latest code from GitHub

# Step 2: Stop running containersWrite-Host "Step 1: Pulling latest code from GitHub..." -ForegroundColor Yellow

Write-Host "Step 2: Stopping running containers..." -ForegroundColor YellowWrite-Host "Purpose: Get the latest changes you pushed" -ForegroundColor Gray

Write-Host "Purpose: Gracefully stop all services before rebuilding" -ForegroundColor Graygit fetch origin

docker-compose downgit pull origin main

if ($LASTEXITCODE -ne 0) {if ($LASTEXITCODE -ne 0) {

    Write-Host "⚠️ Warning: Failed to stop containers (they may not be running)" -ForegroundColor Yellow    Write-Host "❌ Failed to pull latest code from GitHub" -ForegroundColor Red

}    exit 1

Write-Host "✅ Containers stopped" -ForegroundColor Green}

Write-Host ""Write-Host "✅ Code updated successfully" -ForegroundColor Green

Write-Host ""

# Step 3: Build Docker images

Write-Host "Step 3: Building Docker images..." -ForegroundColor Yellow# Step 2: Stop running containers

Write-Host "Purpose: Compile the latest code into Docker containers (uses cache for speed)" -ForegroundColor GrayWrite-Host "Step 2: Stopping running containers..." -ForegroundColor Yellow

$env:DOCKER_BUILDKIT=0Write-Host "Purpose: Gracefully stop all services before rebuilding" -ForegroundColor Gray

$env:COMPOSE_DOCKER_CLI_BUILD=0docker-compose down

docker-compose buildif ($LASTEXITCODE -ne 0) {

if ($LASTEXITCODE -ne 0) {    Write-Host "⚠️ Warning: Failed to stop containers (they may not be running)" -ForegroundColor Yellow

    Write-Host "❌ Failed to build Docker images" -ForegroundColor Red}

    exit 1Write-Host "✅ Containers stopped" -ForegroundColor Green

}Write-Host ""

Write-Host "✅ Docker images built successfully" -ForegroundColor Green

Write-Host ""# Step 3: Build Docker images

Write-Host "Step 3: Building Docker images..." -ForegroundColor Yellow

# Step 4: Run database migrationsWrite-Host "Purpose: Compile the latest code into Docker containers (uses cache for speed)" -ForegroundColor Gray

Write-Host "Step 4: Running database migrations..." -ForegroundColor Yellowdocker-compose build

Write-Host "Purpose: Update database schema if there are any changes" -ForegroundColor Grayif ($LASTEXITCODE -ne 0) {

Set-Location "National-Universty-Backend"    Write-Host "❌ Failed to build Docker images" -ForegroundColor Red

# Check if there are pending migrations    exit 1

$migrationStatus = npx prisma migrate status 2>&1}

if ($migrationStatus -match "Database schema is up to date") {Write-Host "✅ Docker images built successfully" -ForegroundColor Green

    Write-Host "✅ No migrations needed - database is up to date" -ForegroundColor GreenWrite-Host ""

}

else {# Step 4: Run database migrations

    npx prisma migrate deployWrite-Host "Step 4: Running database migrations..." -ForegroundColor Yellow

    if ($LASTEXITCODE -ne 0) {Write-Host "Purpose: Update database schema if there are any changes" -ForegroundColor Gray

        Write-Host "❌ Failed to run migrations" -ForegroundColor RedSet-Location "National-Universty-Backend"

        Set-Location ".."# Check if there are pending migrations

        exit 1$migrationStatus = npx prisma migrate status

    }if ($migrationStatus -match "Database schema is up to date") {

    Write-Host "✅ Database migrations completed" -ForegroundColor Green    Write-Host "✅ No migrations needed - database is up to date" -ForegroundColor Green

}}

Set-Location ".."else {

Write-Host ""    npx prisma migrate deploy

    if ($LASTEXITCODE -ne 0) {

# Step 5: Start containers        Write-Host "❌ Failed to run migrations" -ForegroundColor Red

Write-Host "Step 5: Starting containers..." -ForegroundColor Yellow        Set-Location ".."

Write-Host "Purpose: Launch all services with the new code" -ForegroundColor Gray        exit 1

docker-compose up -d    }

if ($LASTEXITCODE -ne 0) {    Write-Host "✅ Database migrations completed" -ForegroundColor Green

    Write-Host "❌ Failed to start containers" -ForegroundColor Red}

    exit 1Set-Location ".."

}Write-Host ""

Write-Host "✅ Containers started successfully" -ForegroundColor Green

Write-Host ""# Step 5: Start containers

Write-Host "Step 5: Starting containers..." -ForegroundColor Yellow

# Step 6: Wait for services to be healthyWrite-Host "Purpose: Launch all services with the new code" -ForegroundColor Gray

Write-Host "Step 6: Waiting for services to be healthy..." -ForegroundColor Yellowdocker-compose up -d

Write-Host "Purpose: Ensure all services are running properly" -ForegroundColor Grayif ($LASTEXITCODE -ne 0) {

Start-Sleep -Seconds 15    Write-Host "❌ Failed to start containers" -ForegroundColor Red

    exit 1

# Check container health}

$backend = docker ps --filter "name=national-university-backend" --format "{{.Status}}"Write-Host "✅ Containers started successfully" -ForegroundColor Green

$frontend = docker ps --filter "name=national-university-frontend" --format "{{.Status}}"Write-Host ""

$redis = docker ps --filter "name=national-university-redis" --format "{{.Status}}"

# Step 6: Wait for services to be healthy

Write-Host ""Write-Host "Step 6: Waiting for services to be healthy..." -ForegroundColor Yellow

Write-Host "Container Status:" -ForegroundColor CyanWrite-Host "Purpose: Ensure all services are running properly" -ForegroundColor Gray

Write-Host "  Backend:  $backend" -ForegroundColor WhiteStart-Sleep -Seconds 15

Write-Host "  Frontend: $frontend" -ForegroundColor White

Write-Host "  Redis:    $redis" -ForegroundColor White# Check container health

Write-Host ""$backend = docker ps --filter "name=national-university-backend" --format "{{.Status}}"

$frontend = docker ps --filter "name=national-university-frontend" --format "{{.Status}}"

# Step 7: Show deployment summary$redis = docker ps --filter "name=national-university-redis" --format "{{.Status}}"

Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Deployment Summary" -ForegroundColor CyanWrite-Host ""

Write-Host "========================================" -ForegroundColor CyanWrite-Host "Container Status:" -ForegroundColor Cyan

Write-Host "✅ Code pulled from GitHub" -ForegroundColor GreenWrite-Host "  Backend:  $backend" -ForegroundColor White

Write-Host "✅ Docker images rebuilt" -ForegroundColor GreenWrite-Host "  Frontend: $frontend" -ForegroundColor White

Write-Host "✅ Database migrations applied" -ForegroundColor GreenWrite-Host "  Redis:    $redis" -ForegroundColor White

Write-Host "✅ All services restarted" -ForegroundColor GreenWrite-Host ""

Write-Host ""

Write-Host "🚀 Deployment completed at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Green# Step 7: Show deployment summary

Write-Host ""Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Access the application at:" -ForegroundColor CyanWrite-Host "Deployment Summary" -ForegroundColor Cyan

Write-Host "  Frontend: http://localhost" -ForegroundColor WhiteWrite-Host "========================================" -ForegroundColor Cyan

Write-Host "  Backend:  http://localhost:3000" -ForegroundColor WhiteWrite-Host "✅ Code pulled from GitHub" -ForegroundColor Green

Write-Host ""Write-Host "✅ Docker images rebuilt" -ForegroundColor Green

Write-Host "✅ Database migrations applied" -ForegroundColor Green
Write-Host "✅ All services restarted" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Deployment completed at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Green
Write-Host ""
Write-Host "Access the application at:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost" -ForegroundColor White
Write-Host "  Backend:  http://localhost:3000" -ForegroundColor White
Write-Host ""
