<#
.SYNOPSIS
    Starts the LURNIX FastAPI Backend Server.
.DESCRIPTION
    Sets up the Python virtual environment, installs dependencies if missing,
    and runs uvicorn with hot-reload enabled on http://localhost:8000.
#>

$ErrorActionPreference = 'Stop'

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Starting LURNIX Backend Server        " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Determine script & backend directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (Test-Path (Join-Path $ScriptDir "backend")) {
    $BackendDir = Join-Path $ScriptDir "backend"
} elseif (Test-Path (Join-Path $ScriptDir "app\main.py")) {
    $BackendDir = $ScriptDir
} else {
    $BackendDir = (Get-Location).Path
}

Write-Host "[1/4] Checking Backend directory: $BackendDir" -ForegroundColor Yellow
Set-Location $BackendDir

# Determine python command
$PythonCmd = "python"
if (-not (Get-Command $PythonCmd -ErrorAction SilentlyContinue)) {
    if (Get-Command "py" -ErrorAction SilentlyContinue) {
        $PythonCmd = "py"
    } else {
        Write-Error "Python is not installed or not in PATH. Please install Python 3.10+."
        exit 1
    }
}

# Check virtual environment
$VenvDir = Join-Path $BackendDir ".venv"
$VenvPython = Join-Path $VenvDir "Scripts\python.exe"
$VenvUvicorn = Join-Path $VenvDir "Scripts\uvicorn.exe"

if (-not (Test-Path $VenvPython)) {
    Write-Host "[2/4] Creating virtual environment at .venv..." -ForegroundColor Yellow
    & $PythonCmd -m venv $VenvDir
}

# Check environment configuration
$EnvFile = Join-Path $BackendDir ".env"
$EnvExample = Join-Path $BackendDir ".env.example"
if (-not (Test-Path $EnvFile)) {
    if (Test-Path $EnvExample) {
        Write-Host "[3/4] Creating .env from .env.example..." -ForegroundColor Yellow
        Copy-Item $EnvExample $EnvFile
    }
}

# Verify / install dependencies if uvicorn is not yet installed
if (-not (Test-Path $VenvUvicorn)) {
    Write-Host "[3/4] Installing backend dependencies from requirements.txt..." -ForegroundColor Yellow
    & $VenvPython -m pip install --upgrade pip
    & $VenvPython -m pip install -r "requirements.txt"
}

Write-Host "[4/4] Starting FastAPI server on http://localhost:8000..." -ForegroundColor Green
Write-Host "      Interactive Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "      Health Check:     http://localhost:8000/health" -ForegroundColor Green
Write-Host "--------------------------------------------------" -ForegroundColor Gray

# Launch uvicorn
& $VenvUvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

