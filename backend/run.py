# TO RUN THIS SERVER:
# Use the virtual environment python by running this exact command in the terminal:
# .\venv\Scripts\python.exe run.py

import os
import sys
import subprocess

# We use the virtual environment python directly, so no auto-activation is needed here.
import uvicorn

if __name__ == "__main__":
    # Ensure port is open, default to 8000
    port = int(os.environ.get("PORT", 8000))
    # Run uvicorn server, reload enabled for development, mapping app.main:app
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
