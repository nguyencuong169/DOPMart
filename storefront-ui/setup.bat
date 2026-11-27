@echo off
cd /d "%~dp0"
where npm >nul 2>&1 || (echo Install Node.js 22.16+ first & pause & exit /b 1)
call npm install
if errorlevel 1 (pause & exit /b 1)
pause
