#!/usr/bin/env bash
set -e

echo "=== 🌿 Updating Kiaan Nursery on VPS ==="

# Pull latest commits
echo "--> Pulling latest changes from Git..."
git pull origin main

# Build and start Docker container
echo "--> Building and starting Docker container..."
docker compose up -d --build

# Show running status
echo "--> Container status:"
docker compose ps

echo "=== ✅ Kiaan Nursery updated successfully! ==="
