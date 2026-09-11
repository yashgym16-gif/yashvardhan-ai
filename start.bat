@echo off
title YASHVARDHAN AI - System Launcher
color 0b
echo ========================================================
echo         INITIALIZING YASHVARDHAN AI SYSTEM CORE
echo ========================================================
echo.
echo [*] Starting Backend Automation Server (Port 5000)...
start "Yashvardhan AI Backend" cmd /k "cd /d "%~dp0server" && node src/index.js"

echo [*] Starting Frontend Interface (Port 5173)...
start "Yashvardhan AI Client" cmd /k "cd /d "%~dp0client" && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo [*] Opening Assistant Interface in Browser...
start http://localhost:5173

echo.
echo ========================================================
echo  SYSTEM ONLINE: YASHVARDHAN AI IS LISTENING FOR COMMANDS
echo  Wake words: "Hey Yashvardhan", "Get up bro"
echo ========================================================
echo.
