# ========================================================
# Production Deployment Script (PowerShell)
# Pulls latest published images from Docker Hub and restarts containers
# ========================================================
param (
    [string]$DockerHubUsername = $env:DOCKERHUB_USERNAME,
    [string]$ImageTag = "latest"
)

if (-not $DockerHubUsername) {
    if (Test-Path .env) {
        Get-Content .env | Where-Object { $_ -match "^DOCKERHUB_USERNAME=(.*)" } | ForEach-Object {
            $DockerHubUsername = $Matches[1].Trim()
        }
    }
}

if (-not $DockerHubUsername) {
    Write-Host "ERROR: Docker Hub Username is required." -ForegroundColor Red
    Write-Host "Usage: .\scripts\deploy.ps1 -DockerHubUsername <your_username> [-ImageTag latest]" -ForegroundColor Yellow
    exit 1
}

$env:DOCKERHUB_USERNAME = $DockerHubUsername
$env:IMAGE_TAG = $ImageTag

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Starting Aura Kicks Deployment from Docker Hub" -ForegroundColor Green
Write-Host "Docker Hub : $env:DOCKERHUB_USERNAME" -ForegroundColor White
Write-Host "Image Tag  : $env:IMAGE_TAG" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan

Write-Host "Step 1: Pulling latest Docker images..." -ForegroundColor Yellow
docker compose -f docker-compose.prod.yml pull

Write-Host "Step 2: Starting containers in detached mode..." -ForegroundColor Yellow
docker compose -f docker-compose.prod.yml up -d --remove-orphans

Write-Host "Step 3: Checking container status..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
docker compose -f docker-compose.prod.yml ps

Write-Host "Step 4: Cleaning up dangling Docker images..." -ForegroundColor Yellow
docker image prune -f

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Deployment Finished Successfully!" -ForegroundColor Green
Write-Host "Storefront Customer Portal: http://localhost:3000" -ForegroundColor White
Write-Host "Admin Management Console  : http://localhost:3001" -ForegroundColor White
Write-Host "FastAPI Backend API Docs  : http://localhost:5000/docs" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
