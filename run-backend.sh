#!/usr/bin/env bash
set -e

echo "=========================================="
echo "   Starting LURNIX Backend Server"
echo "=========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -d "$SCRIPT_DIR/backend" ]; then
    cd "$SCRIPT_DIR/backend"
fi

if [ ! -d ".venv" ]; then
    echo "[1/3] Creating Python virtual environment..."
    python3 -m venv .venv || python -m venv .venv
fi

# Source virtualenv
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
elif [ -f ".venv/Scripts/activate" ]; then
    source .venv/Scripts/activate
fi

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "[2/3] Creating .env from .env.example..."
    cp .env.example .env
fi

if ! command -v uvicorn &> /dev/null; then
    echo "[2/3] Installing dependencies..."
    pip install -r requirements.txt
fi

echo "[3/3] Starting FastAPI server on http://localhost:8000"
echo "      Interactive Docs: http://localhost:8000/docs"
echo "      Health Check:     http://localhost:8000/health"
echo "------------------------------------------"

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
