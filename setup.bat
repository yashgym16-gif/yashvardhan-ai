@echo off
title YASHVARDHAN AI - Dependencies Setup
color 0b
echo ========================================================
echo     YASHVARDHAN AI - JARVIS WINDOWS ASSISTANT SETUP
echo ========================================================
echo.
echo [*] Step 1/2: Installing Backend Server Dependencies...
cd /d "%~dp0server"
call npm install
if %errorlevel% neq 0 (
    echo [!] Server dependencies installation failed.
    pause
    exit /b %errorlevel%
)

echo.
echo [*] Step 2/2: Installing Client Frontend Dependencies...
cd /d "%~dp0client"
call npm install
if %errorlevel% neq 0 (
    echo [!] Client dependencies installation failed.
    pause
    exit /b %errorlevel%
)

echo.
echo [*] Building Client Frontend Bundle...
call npm run build

echo.
echo ========================================================
echo   [SUCCESS] Setup Completed! You can now run start.bat
echo ========================================================
echo.
pause
