# Migrate to True Real-Time Live Data & Professional Trading UX

The dashboard currently operates on a "Simulation" paradigm. We will redesign this to act as a true **Live Trading Dashboard**, while upgrading the user experience to match professional trading terminals with expert guidance.

**Status:** `Completed` (Version 2)
**Execution Date:** 2026-06-05

## Executed Changes

### 1. True Live Data Engine
- **Backend (`main.py`)**: Replace `run_simulation_loop` with a true `run_live_loop` that actively fetches the latest market data, re-calculates indicators, runs the predictive model, and broadcasts real-time ticks without jumping back in time.
- **Frontend (`page.tsx`)**: Implement a 5-minute background polling interval to silently refresh data if the user leaves the page idle but hasn't clicked "Start Live".
- **Frontend (`Sidebar.tsx`)**: Rename simulation controls to "Live Prediction Engine" and "Live Refresh Rate".

### 2. Historical Lookback Selection
- **Frontend (`Sidebar.tsx`)**: Add a "Lookback Period" dropdown (e.g., 1 Day, 1 Week, 1 Month, 3 Months, 1 Year).
- **Backend (`main.py` & `data_loader.py`)**: Decouple the Yahoo Finance `period` argument from the timeframe. Allow the user's selected lookback period to dictate how much historical data is fetched and returned to the chart (e.g., up to 1000-2000 candles).

### 3. Professional Measurement Guides (Trendlines & High/Lows)
- **Frontend (`LiveChart.tsx`)**: Calculate the absolute Highest High and Lowest Low of the displayed dataset.
- Render dynamic horizontal support/resistance lines at these levels.
- Add a visual projection line (wedge) from the lowest/highest point pointing towards the current price action to help beginners visualize the broader trend direction.

### 4. "Broker's Desk" Expert Guidance
- **Frontend (`StatsCard.tsx`)**: Introduce a "Broker's Analysis" panel.
- This panel will translate the raw ML probabilities and technical indicators into actionable, plain-English advice (e.g., "Strong Bullish momentum detected. Price is bouncing off recent lows. Consider scaling into a LONG position with a tight stop-loss."). This bridges the gap for new starters.
