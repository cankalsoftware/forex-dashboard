import os
import sys
import subprocess

if __name__ == "__main__":
    # Auto-detect and switch to virtual environment if run with global python
    venv_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "venv")
    venv_python = os.path.join(venv_dir, "Scripts", "python.exe") if sys.platform == "win32" else os.path.join(venv_dir, "bin", "python")

    if os.path.exists(venv_python) and sys.executable.lower() != os.path.abspath(venv_python).lower() and not os.environ.get("VENV_AUTO_SWITCHED"):
        os.environ["VENV_AUTO_SWITCHED"] = "1"
        print(f"[*] Activating virtual environment: {venv_python}")
        result = subprocess.run([venv_python] + sys.argv, env=os.environ)
        sys.exit(result.returncode)

    import uvicorn

    # Ensure port is open, default to 8000
    port = int(os.environ.get("PORT", 8000))
    # Run uvicorn server, reload enabled for development, mapping app.main:app
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
