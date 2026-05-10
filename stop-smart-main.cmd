@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-smart-main.ps1"
set "exit_code=%errorlevel%"
echo.
if not "%exit_code%"=="0" (
  echo stop-smart-main failed. ExitCode=%exit_code%
) else (
  echo stop-smart-main finished. smart-frontend and smart-backend have been stopped.
)
pause
endlocal & exit /b %exit_code%
