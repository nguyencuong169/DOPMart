@echo off
cd /d "%~dp0"
if not exist dist\index.html (echo Run build.bat first & pause & exit /b 1)
call npm run preview -- --port 4175 --strictPort
pause
