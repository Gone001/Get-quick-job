import subprocess
import sys
import os

# Change to project directory
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Start backend in background
PROCESS = subprocess.Popen(
    [sys.executable, "backend/main.py"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
)

print(f"Backend started with PID: {PROCESS.pid}")
print("Server: http://localhost:8000")

# Keep reference to prevent garbage collection
import backend_server
backend_server.PROCESS = PROCESS