<#
.SYNOPSIS
    Starts the LURNIX React / Vite Frontend Dev Server.
#>
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendDir = Join-Path $ScriptDir "frontend"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Starting LURNIX Frontend Dev Server    " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Frontend directory: $FrontendDir" -ForegroundColor Yellow

Set-Location $FrontendDir
Write-Host "Starting Vite server on http://localhost:5173..." -ForegroundColor Green
npm run dev

