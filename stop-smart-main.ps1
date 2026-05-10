Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$runtimeDir = Join-Path $root ".smart-main-runtime"
$pidsDir = Join-Path $runtimeDir "pids"

$backendPidFile = Join-Path $pidsDir "smart-backend.pid"
$frontendPidFile = Join-Path $pidsDir "smart-frontend.pid"

function Stop-TrackedProcess {
    param(
        [string]$Name,
        [string]$PidFile
    )

    if (-not (Test-Path -LiteralPath $PidFile)) {
        Write-Host "[$Name] PID file not found, skipped"
        return
    }

    $raw = (Get-Content -LiteralPath $PidFile -Raw).Trim()
    if ([string]::IsNullOrWhiteSpace($raw)) {
        Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
        Write-Host "[$Name] PID file empty, cleaned"
        return
    }

    $processId = [int]$raw
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($null -eq $process) {
        Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
        Write-Host "[$Name] process not found, PID file cleaned"
        return
    }

    & taskkill /PID $processId /T /F | Out-Null
    Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
    Write-Host "[$Name] stopped, PID=$processId"
}

Stop-TrackedProcess -Name "smart-frontend" -PidFile $frontendPidFile
Stop-TrackedProcess -Name "smart-backend" -PidFile $backendPidFile

Write-Host ""
Write-Host "Shutdown complete"
