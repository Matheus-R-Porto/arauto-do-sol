@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js e execute novamente.
  pause
  exit /b 1
)
set PORT=5174
set OPEN_BROWSER=1
node serve.js
pause

