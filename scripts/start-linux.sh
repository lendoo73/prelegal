#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "Building Prelegal..."
docker build -t prelegal .

echo "Starting Prelegal..."
docker stop prelegal 2>/dev/null || true
docker rm prelegal 2>/dev/null || true
if [ -f .env ]; then
    docker run -d --name prelegal -p 8000:8000 --env-file .env prelegal
else
    docker run -d --name prelegal -p 8000:8000 prelegal
fi

echo "Prelegal is running at http://localhost:8000"
