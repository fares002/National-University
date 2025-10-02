# Deployment Script
Set-Location "C:\Users\freem\National-University"
Write-Host "Starting Deployment..." -ForegroundColor Cyan
git config --global --add safe.directory C:/Users/freem/National-University
git fetch origin
git pull origin main
docker-compose down
$env:DOCKER_BUILDKIT=0
$env:COMPOSE_DOCKER_CLI_BUILD=0
docker-compose build
docker-compose up -d
Write-Host "Deployment complete!" -ForegroundColor Green
