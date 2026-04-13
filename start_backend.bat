@echo off
cd C:\Users\dassg\Downloads\Quick_job
call venv\Scripts\activate.bat
uvicorn backend.main:app --reload --port 8000