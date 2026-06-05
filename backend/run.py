import os
import sys
import subprocess

# Auto-activate virtual environment if not already running inside it
current_dir = os.path.dirname(os.path.abspath(__file__))
# Check for Windows or Linux/Mac virtual environment path
venv_python = os.path.join(current_dir, "venv", "Scripts", "python.exe") if os.name == "nt" else os.path.join(current_dir, "venv", "bin", "python")

if os.path.exists(venv_python):
    exec_path = os.path.abspath(sys.executable).lower()
    venv_path = os.path.abspath(venv_python).lower()
    if exec_path != venv_path:
        print("Auto-activating virtual environment...")
        # Re-launch the script using the venv's python
        sys.exit(subprocess.call([venv_python] + sys.argv))

# Now we can safely import third-party modules
import uvicorn

if __name__ == "__main__":
    # Ensure port is open, default to 8000
    port = int(os.environ.get("PORT", 8000))
    # Run uvicorn server, reload enabled for development, mapping app.main:app
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
