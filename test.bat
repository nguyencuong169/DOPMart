@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
 echo Install Node.js 22.16 or newer first.
 pause
 exit /b 1
)
node scripts\quickstart.mjs test
set "RESULT=%ERRORLEVEL%"
if not "%RESULT%"=="0" echo Command failed. See messages above.
pause
exit /b %RESULT%
