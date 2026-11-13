@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo    Starting LURNIX Backend Server
echo ==========================================

cd /d "%~dp0"
if exist "backend\app\main.py" (
    cd backend
)

if not exist ".venv\Scripts\python.exe" (
    echo [1/3] Creating virtual environment at .venv...
    python -m venv .venv
    if errorlevel 1 (
        py -m venv .venv
    )
)

if not exist ".env" (
    if exist ".env.example" (
        echo [2/3] Initializing .env configuration...
        copy .env.example .env >nul
    )
)

if not exist ".venv\Scripts\uvicorn.exe" (
    echo [2/3] Installing dependencies...
    .venv\Scripts\python.exe -m pip install -r requirements.txt
)

echo [3/3] Starting FastAPI server on http://localhost:8000
echo       API Documentation: http://localhost:8000/docs
echo       Health Status:     http://localhost:8000/health
echo ------------------------------------------

.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload

