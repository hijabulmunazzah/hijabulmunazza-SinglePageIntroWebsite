@echo off
title Hijab ul Munnazah — Website Launcher
echo ========================================================
echo    Starting Hijab ul Munnazah Website...
echo ========================================================

cd /d "%~dp0"

:: Check if port 3000 is already active
netstat -ano | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo [INFO] Local server is already running!
) else (
    echo [INFO] Starting local server in background...
    start /b node local_server.js
    timeout /t 1 /nobreak >nul
)

echo [INFO] Opening website in default browser...
start http://localhost:3000/
exit
