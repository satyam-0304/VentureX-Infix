@echo off
echo ==========================================
echo    Starting LURNIX Frontend Dev Server
echo ==========================================
cd /d "%~dp0frontend"
call npm run dev
