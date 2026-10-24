@echo off
title RefVision AI - Backend
echo ===================================================
echo Starting RefVision AI Backend Server...
echo ===================================================
cd /d "%~dp0"
"..\.venv\Scripts\python.exe" scripts\run_backend.py
pause
