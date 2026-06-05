# VSCode Migration & Monorepo Deployment Plan

You want to move the project from the temporary scratch folder to your actual development workspace (`C:\Users\uyko7\Documents\VSCode`) and set it up as a Monorepo ready for GitHub, Vercel, and Vultr. This is a perfect approach.

## User Review Required

> [!WARNING]
> Your terminal is currently running `python run.py` and `pnpm dev`. On Windows, files that are currently in use by a running process are locked and **cannot be moved**.
> 
> **Please go to your terminals and press `Ctrl + C` to stop both the Next.js server and the Python server before approving this plan.**

## Proposed Architecture & Actions

1. **Create Root Directory in VSCode Workspace**
   Create a new parent folder: `C:\Users\uyko7\Documents\VSCode\forex-dashboard`.

2. **Move Frontend & Backend**
   Move the `frontend` and `backend` folders side-by-side into the new `forex-dashboard` directory.
   ```text
   C:\Users\uyko7\Documents\VSCode\forex-dashboard\
   ├── frontend/   <-- Vercel will deploy only this folder
   └── backend/    <-- Vultr will run only this folder
   ```

3. **Rebuild Environments (pnpm & python)**
   As you noted, moving these environments breaks absolute paths. I will:
   - Delete `node_modules` in the frontend and run `pnpm install`.
   - Delete `venv` in the backend, create a fresh virtual environment, and run `pip install -r requirements.txt`.

4. **Decouple API URLs using Environment Variables**
   Currently, your frontend has hardcoded `localhost` URLs. I will update `page.tsx` to use environment variables (`NEXT_PUBLIC_API_URL`) so the frontend knows where to look.
   - **Local Development**: Connects to `localhost:8000`
   - **Production (Vercel)**: Connects to your Vultr IP/Domain

5. **Update `package.json` for Local Dev**
   I'll update the `concurrently` script in the frontend so `pnpm dev` continues to automatically spin up both servers locally for your convenience.

## Verification Plan
Once the files are moved and dependencies are reinstalled, I will start the new `pnpm dev` process from the new `VSCode` folder to verify everything spins up successfully in the new workspace!
