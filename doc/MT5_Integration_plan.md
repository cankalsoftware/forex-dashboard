# MetaTrader 5 Live Integration Plan

## Goal
Integrate your running MetaTrader 5 terminal as a direct, lightning-fast live data source for the dashboard, removing the need to export MT5 CSV files.

## Proposed Changes

### Requirements
#### `backend/requirements.txt`
- Add the `MetaTrader5` official python package.

### Frontend
#### `frontend/src/components/Sidebar.tsx`
- Add `'MT5 Live app'` to the `sources` array.

### Backend Data Loader
#### `backend/app/data_loader.py`
- Import `MetaTrader5 as mt5` (handled safely so the app doesn't crash if it's not installed).
- Create `download_mt5(pair, interval)` function:
  1. Calls `mt5.initialize()` to connect to your running terminal.
  2. Converts pair formatting (e.g., `GBP/USD` to `GBPUSD`).
  3. Maps timeframe (e.g., `5-minute` to `mt5.TIMEFRAME_M5`).
  4. Fetches the latest 1,000 candles directly from the terminal using `mt5.copy_rates_from_pos()`.
  5. Formats the data into our standard `Pandas DataFrame` (Open, High, Low, Close, Volume, Timestamp).

### Backend Engine
#### `backend/app/main.py`
- Update `load_data()` to route the `"MT5 Live app"` data source directly to `download_mt5()`. 
- No API keys are required for this route, it simply talks to your local MT5 terminal!

## Verification Plan
1. Ensure your MT5 terminal is open in the background.
2. Select **MT5 Live app** from the Sidebar dropdown.
3. Verify that the chart populates instantly with your broker's live data.
