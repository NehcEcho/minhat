Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $root "smart\smart\backend"
$frontendDir = Join-Path $root "smart\smart\frontend"
$runtimeDir = Join-Path $root ".smart-main-runtime"
$logsDir = Join-Path $runtimeDir "logs"
$pidsDir = Join-Path $runtimeDir "pids"

$backendPidFile = Join-Path $pidsDir "smart-backend.pid"
$frontendPidFile = Join-Path $pidsDir "smart-frontend.pid"
$backendOutLog = Join-Path $logsDir "smart-backend.out.log"
$backendErrLog = Join-Path $logsDir "smart-backend.err.log"
$frontendOutLog = Join-Path $logsDir "smart-frontend.out.log"
$frontendErrLog = Join-Path $logsDir "smart-frontend.err.log"

function Ensure-Directory {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
    }
}

function Resolve-CommandPath {
    param([string[]]$Names)

    foreach ($name in $Names) {
        $command = Get-Command $name -ErrorAction SilentlyContinue
        if ($null -ne $command) {
            return $command.Source
        }
    }

    throw "Command not found: $($Names -join ', ')"
}

function Get-PythonCommandLine {
    $pythonCommand = Get-Command "python.exe" -ErrorAction SilentlyContinue
    if ($null -ne $pythonCommand) {
        return '"' + $pythonCommand.Source + '" -m uvicorn app.main:app --host 127.0.0.1 --port 8000'
    }

    $pythonCommand = Get-Command "python" -ErrorAction SilentlyContinue
    if ($null -ne $pythonCommand) {
        return '"' + $pythonCommand.Source + '" -m uvicorn app.main:app --host 127.0.0.1 --port 8000'
    }

    $pyCommand = Get-Command "py.exe" -ErrorAction SilentlyContinue
    if ($null -ne $pyCommand) {
        return '"' + $pyCommand.Source + '" -3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000'
    }

    $pyCommand = Get-Command "py" -ErrorAction SilentlyContinue
    if ($null -ne $pyCommand) {
        return '"' + $pyCommand.Source + '" -3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000'
    }

    throw "Command not found: python.exe, python, py.exe, py"
}

function Get-TrackedProcess {
    param([string]$PidFile)

    if (-not (Test-Path -LiteralPath $PidFile)) {
        return $null
    }

    $raw = (Get-Content -LiteralPath $PidFile -Raw).Trim()
    if ([string]::IsNullOrWhiteSpace($raw)) {
        Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
        return $null
    }

    $process = Get-Process -Id ([int]$raw) -ErrorAction SilentlyContinue
    if ($null -eq $process) {
        Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
        return $null
    }

    return $process
}

function Start-TrackedProcess {
    param(
        [string]$Name,
        [string]$WorkingDirectory,
        [string]$CommandLine,
        [string]$PidFile,
        [string]$StdOutLog,
        [string]$StdErrLog
    )

    $existing = Get-TrackedProcess -PidFile $PidFile
    if ($null -ne $existing) {
        Write-Host "[$Name] already running, PID=$($existing.Id)"
        return $existing
    }

    if (Test-Path -LiteralPath $StdOutLog) {
        Remove-Item -LiteralPath $StdOutLog -Force
    }

    if (Test-Path -LiteralPath $StdErrLog) {
        Remove-Item -LiteralPath $StdErrLog -Force
    }

    $process = Start-Process -FilePath $env:ComSpec `
        -ArgumentList "/c", $CommandLine `
        -WorkingDirectory $WorkingDirectory `
        -RedirectStandardOutput $StdOutLog `
        -RedirectStandardError $StdErrLog `
        -WindowStyle Hidden `
        -PassThru

    Set-Content -LiteralPath $PidFile -Value $process.Id
    Start-Sleep -Seconds 2

    if ($process.HasExited) {
        Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
        throw "[$Name] failed to start. Check log: $StdErrLog"
    }

    Write-Host "[$Name] started, PID=$($process.Id)"
    return $process
}

if (-not (Test-Path -LiteralPath $backendDir)) {
    throw "Directory not found: $backendDir"
}

if (-not (Test-Path -LiteralPath $frontendDir)) {
    throw "Directory not found: $frontendDir"
}

if (-not (Test-Path -LiteralPath (Join-Path $frontendDir "node_modules"))) {
    throw "smart frontend missing node_modules. Run npm install first."
}

Ensure-Directory -Path $runtimeDir
Ensure-Directory -Path $logsDir
Ensure-Directory -Path $pidsDir

$npmCommand = Resolve-CommandPath -Names @("npm.cmd", "npm")

$backendCommandLine = Get-PythonCommandLine
$frontendCommandLine = '"' + $npmCommand + '" run dev -- --host 127.0.0.1 --port 5200'

Start-TrackedProcess -Name "smart-backend" -WorkingDirectory $backendDir -CommandLine $backendCommandLine -PidFile $backendPidFile -StdOutLog $backendOutLog -StdErrLog $backendErrLog | Out-Null
Start-TrackedProcess -Name "smart-frontend" -WorkingDirectory $frontendDir -CommandLine $frontendCommandLine -PidFile $frontendPidFile -StdOutLog $frontendOutLog -StdErrLog $frontendErrLog | Out-Null

Write-Host ""
Write-Host "Startup complete"
Write-Host "Frontend: http://127.0.0.1:5200"
Write-Host "Backend: http://127.0.0.1:8000"
Write-Host "Logs: $logsDir"
