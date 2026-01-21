@echo off
title SatyaLens Face (Frontend)
color 0B

:: 1. Navigate to the frontend folder
cd /d "%~dp0frontend"

:: 2. Start the Vite Server
echo [INFO] Starting React Interface...
echo ---------------------------------------------------
npm run dev

pause