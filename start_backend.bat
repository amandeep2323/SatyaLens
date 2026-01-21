@echo off
title SatyaLens Brain (Backend)
color 0A

:: 1. Navigate to the project root
cd /d "%~dp0"

:: 2. Activate Virtual Environment (if it exists)
if exist "venv\Scripts\activate.bat" (
    echo [INFO] Activating Virtual Environment...
    call venv\Scripts\activate.bat
) else (
    echo [WARNING] 'venv' not found. Trying global Python...
)

:: 3. Run the Server
:: We explicitly set port 4242 because your React app looks for http://127.0.0.1:4242
echo [INFO] Starting SatyaLens Engine on Port 4242...
echo ---------------------------------------------------
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 4242

pause