@echo off
echo Starting Productivity Dashboard...
cd /d "%~dp0"
:: This command starts the server and opens your default browser automatically
call npm run dev -- --open
pause
