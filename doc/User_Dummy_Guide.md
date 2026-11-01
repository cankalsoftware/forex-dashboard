# 🚀 Forex Predictor Dashboard — User's Dummy Guide

Welcome to the **Antigravity Forex Predictor Dashboard**! This guide is designed to be simple, clear, and straightforward so anyone can spin up the app and start analyzing currency pairs with machine learning in minutes.

---

## ⚡ 1. How to Start the App (Step-by-Step)

You need **two terminal windows** open in VS Code (or PowerShell): one for the Python Backend and one for the Next.js Frontend.

```
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
│         TERMINAL 1: BACKEND          │     │         TERMINAL 2: FRONTEND         │
│                                      │     │                                      │
│  cd backend                          │     │  cd frontend                         │
│  .\venv\Scripts\python.exe run.py    │     │  pnpm dev   (or npm run dev)         │
│                                      │     │                                      │
│  ➜ Running on http://localhost:8000  │     │  ➜ Ready on http://localhost:3000    │
└──────────────────┬───────────────────┘     └──────────────────┬───────────────────┘
                   │                                            │
                   └──────────────────┬─────────────────────────┘
                                      ▼
                      Open http://localhost:3000 in Chrome/Edge
```

### Terminal 1: Start the Backend (FastAPI / Python)
1. Open a new terminal in VS Code (`Ctrl + ~` or Terminal > New Terminal).
2. Run:
   ```powershell
   cd backend
   .\venv\Scripts\python.exe run.py
   ```
   *You should see:* `INFO: Uvicorn running on http://0.0.0.0:8000`

### Terminal 2: Start the Frontend (Next.js / React)
1. Open a second terminal window (click the `+` split button in the terminal panel).
2. Run:
   ```powershell
   cd frontend
   pnpm dev
   ```
   *(If you don't use pnpm, `npm run dev` works too).*
3. Open your web browser and go to: **[http://localhost:3000](http://localhost:3000)**

---

## 🖥️ 2. What's On Your Screen? (Visual Tour)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [TOP BAR]  Forex Predictor Dashboard  |  Ticker: Yahoo Finance  |  Model: Fast  | 5m   │
├─────────────────┬──────────────────────────────────────────────────────────────────────┤
│  LEFT SIDEBAR   │  [STATS & BROKER'S DESK]                                             │
│                 │  • Next Move Forecast: BULLISH (74%)                                 │
│  • Currency Pair│  • Model Accuracy / Loss                                             │
│  • Timeframe    │  • RSI / Volatility                                                  │
│  • Lookback     │  • Broker's Advice: "Strong Bullish momentum detected. Consider..."  │
│  • ML Model     ├──────────────────────────────────────────────────────────────────────┤
│  • Live Engine  │  [LIVE CANDLESTICK CHART]                                            │
│    [▶ Start Live]│  • Real-time candles with High/Low bounds & Dynamic Trendlines       │
│  • Retrain Model│  • Dotted Projection Path & Ghost Forecast Bars                      │
│                 ├──────────────────────────────────────────────────────────────────────┤
│                 │  [DATA MANAGEMENT CENTER]                                            │
│                 │  • Custom CSV Import (Dukascopy / HistData)                          │
│                 │  • Live API Keys (Twelve Data / Oanda)                               │
└─────────────────┴──────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 3. Core Features & How to Use Them

### A. Live Market Prediction Engine
- Click the green **"Start Live"** button in the sidebar.
- The dashboard activates real-time streaming: it periodically pulls the freshest candles, computes technical indicators (RSI, ATR, Bollinger Bands), and feeds them into the active ML model.
- The chart renders a **dotted forecast line** and **translucent ghost forecast candles** showing the expected price trajectory.

### B. Choosing Your Machine Learning Model
In the sidebar, under **Machine Learning Model**, you have two options:
1. **Fast Model (XGBoost & Ridge)**:
   - **Best for:** Instant feedback, low latency.
   - **Training time:** 1–5 seconds.
2. **Detailed Model (Deep PyTorch LSTM Neural Network)**:
   - **Best for:** Capturing long-term temporal dependencies and complex multi-candle patterns.
   - **Training time:** 1–3 minutes.
   - *Tip:* If the top banner says "Detailed Model not trained yet", simply click **"Retrain Active Model"** in the sidebar.

### C. Reading the "Broker's Desk"
In the top stats card, the **Broker's Desk** translates raw AI probabilities and technical indicators into plain English:
- **Bullish Advice (>60%)**: Suggests long positioning and points out support stop-loss levels.
- **Bearish Advice (<40%)**: Suggests short positioning and resistance exit points.
- **Neutral Advice (40%–60%)**: Recommends holding flat to avoid whipsaws.
- **RSI Alert**: Highlights whether the pair is currently overbought (>70) or oversold (<30).

### D. Data Sources
You can switch data sources in the sidebar:
1. **Yahoo Finance (Default)**: Free, instant, zero setup required.
2. **MetaTrader 5 (MT5 Live app)**: Connects directly to your desktop MetaTrader 5 terminal. Zero API keys needed — just make sure MT5 is open on your PC!
3. **Twelve Data & Oanda (Live APIs)**: High-precision real-time broker feeds. Enter your API keys under **Data Management Center > Live API Settings**.
4. **Custom CSV (Dukascopy / HistData)**: Upload tick/candle `.csv` files under **Data Management Center > Custom CSV Data Center**.

---

## ❓ 4. Frequently Asked Questions & Troubleshooting

### Q: The chart says "Failed to fetch" or numbers aren't loading.
- **Fix:** Make sure Terminal 1 (Python backend) is running and shows no errors on `http://localhost:8000`.

### Q: When running `python run.py`, it says module not found (e.g. `uvicorn` or `torch`).
- **Fix:** Ensure you are using the project's virtual environment:
  ```powershell
  cd backend
  .\venv\Scripts\python.exe run.py
  ```

### Q: How do I stop the servers?
- In either terminal window, press `Ctrl + C`.

---

*Enjoy trading and predicting with Antigravity Forex! 📈*
