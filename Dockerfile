# Stage 1: Build Next.js frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend
FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Install Python dependencies (cached layer)
COPY backend/pyproject.toml ./
RUN uv pip install --system fastapi "uvicorn[standard]" pyjwt "passlib[bcrypt]" "bcrypt>=3.2.0,<4.0.0" python-dotenv

# Copy backend source
COPY backend/main.py ./
COPY backend/app/ ./app/

# Copy built frontend
COPY --from=frontend-builder /app/out ./static/

# Copy shared assets
COPY catalog.json ./
COPY templates/ ./templates/

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
