@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-smart-main.ps1"
set "exit_code=%errorlevel%"
echo.
if not "%exit_code%"=="0" (
  echo start-smart-main failed. ExitCode=%exit_code%
) else (
  echo start-smart-main finished. smart-frontend and smart-backend should keep running in background.
)
pause
endlocal & exit /b %exit_code%
