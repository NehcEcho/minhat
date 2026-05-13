@echo off
chcp 65001 >nul
title Smart Helmet - Startup

echo ========================================
echo   Smart Helmet Management System
echo ========================================
echo.

echo [1/4] Installing backend dependencies...
cd /d "%~dp0backend"
pip install -r requirements.txt -q
if %errorlevel% neq 0 (
    echo [ERROR] Backend dependencies install failed!
    pause
    exit /b 1
)
echo [OK] Backend dependencies ready.
echo.

echo [2/4] Installing frontend dependencies...
cd /d "%~dp0frontend"
call npm install --silent
if %errorlevel% neq 0 (
    echo [ERROR] Frontend dependencies install failed!
    pause
    exit /b 1
)
echo [OK] Frontend dependencies ready.
echo.

echo [3/4] Starting backend (port 9000)...
cd /d "%~dp0backend"
start "Smart Helmet - Backend" cmd /k "title Smart Helmet Backend && uvicorn app.main:app --host 0.0.0.0 --port 9000"
echo [OK] Backend started.
echo.

echo [4/4] Starting frontend (port 5200)...
cd /d "%~dp0frontend"
start "Smart Helmet - Frontend" cmd /k "title Smart Helmet Frontend && npm run dev -- --host 0.0.0.0 --port 5200"
echo [OK] Frontend started.
echo.

echo ========================================
echo   All services started!
echo   Backend:  http://10.134.21.110:9000
echo   Frontend: http://10.134.21.110:5200
echo ========================================
echo.
echo Close this window to stop both services.
pause
