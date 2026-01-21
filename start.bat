@echo off
title SatyaLens Launcher

echo ==================================================
echo        S A T Y A   L E N S   L A U N C H E R
echo ==================================================
echo.

echo 1. Launching Backend (The Brain)...
start "SatyaLens Backend" cmd /k "%~dp0start_backend.bat"

:: Wait 3 seconds to let the backend initialize
timeout /t 3 /nobreak >nul

echo 2. Launching Frontend (The Face)...
start "SatyaLens Frontend" cmd /k "%~dp0start_frontend.bat"

echo.
echo [SUCCESS] SatyaLens is running.
echo You can minimize this window.
echo.
timeout /t 5
exit