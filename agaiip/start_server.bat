@echo off
chcp 65001 >nul
echo Starting Antigravity Daemon...
echo.
echo NOTE: If you want to access this from the Vercel frontend on another device,
echo you need a public URL. This script attempts to use 'pyngrok'.
echo.
echo Install pyngrok if needed: pip install pyngrok
echo.

:: Change directory to the folder where this script is located
cd /d "%~dp0"

:: Run the python script from the current directory
python antigravity_daemon.py
pause