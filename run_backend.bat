@echo off
cd /d %~dp0
echo Starting Quick Job Backend...
echo.

REM Check if venv exists
if not exist "venv\Scripts\activate.bat" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate venv
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies if not already
python -c "import fastapi" 2>nul
if errorlevel 1 (
    echo Installing dependencies...
    pip install fastapi uvicorn sqlalchemy asyncpg pydantic pydantic[email] python-dotenv python-multipart
)

REM Run backend
echo.
echo Starting server on http://localhost:8000
echo Press Ctrl+C to stop
echo.
python backend\main.py