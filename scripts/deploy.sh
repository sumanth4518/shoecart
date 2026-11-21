#!/usr/bin/env bash
set -e

# ========================================================
# Production Deployment Script for Aura Kicks Footwear App
# Pulls latest published images from Docker Hub and restarts containers
# ========================================================

# Load environment variables if .env exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

DOCKERHUB_USERNAME="${DOCKERHUB_USERNAME:-$1}"
IMAGE_TAG="${IMAGE_TAG:-${2:-latest}}"

if [ -z "$DOCKERHUB_USERNAME" ]; then
  echo "ERROR: DOCKERHUB_USERNAME is required."
  echo "Usage: ./deploy.sh <dockerhub_username> [image_tag]"
  echo "Or set DOCKERHUB_USERNAME in .env"
  exit 1
fi

export DOCKERHUB_USERNAME
export IMAGE_TAG

echo "=========================================================="
echo "Starting Aura Kicks Deployment from Docker Hub"
echo "Target Hub: $DOCKERHUB_USERNAME"
echo "Image Tag : $IMAGE_TAG"
echo "=========================================================="

echo "Step 1: Pulling latest images from Docker Hub..."
docker compose -f docker-compose.prod.yml pull

echo "Step 2: Starting containers in detached mode..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo "Step 3: Verifying container health..."
sleep 5
docker compose -f docker-compose.prod.yml ps

echo "Step 4: Cleaning up stale/dangling Docker images..."
docker image prune -f

echo "=========================================================="
echo "Deployment Finished Successfully!"
echo "Storefront Customer Portal: http://localhost:3000"
echo "Admin Management Console  : http://localhost:3001"
echo "FastAPI Backend API Docs  : http://localhost:5000/docs"
echo "=========================================================="
