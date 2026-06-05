# Live Data API Integration Plan (TwelveData & Oanda)

## Goal
Implement automated live data fetching using **Twelve Data** and **Oanda**. 
*Note: Oanda does provide a free tier through their **fxTrade Practice (Demo)** accounts, which gives you an API token for testing. Twelve Data provides a free personal tier with rate limits.*

## Open Questions for You
> 1. Do you want me to install their official Python SDKs (`twelvedata` and `oandapyV20`), or should we just use standard HTTP `requests` to keep the backend lightweight? (Standard HTTP is usually easier and faster for just fetching simple candles).
> 2. For Oanda, the Practice API uses a different base URL (`api-fxpractice.oanda.com`) than live accounts. Should we default to the practice URL for free testing?

## Proposed Changes

### Frontend Modifications
#### `frontend/src/components/Sidebar.tsx`
- Add `'Twelve Data'` and `'Oanda'` to the `sources` array so they appear in the Data Source dropdown, alongside Yahoo Finance.

### Backend Modifications
#### `backend/app/data_loader.py`
- Create `download_twelvedata(pair, interval, period, api_key)`:
  - Maps standard pairs (e.g., "EUR/USD") to Twelve Data formats.
  - Fetches the time series endpoint using the provided `api_key`.
  - Parses the JSON response into the standard OHLCV Pandas DataFrame.
- Create `download_oanda(pair, interval, period, api_key)`:
  - Maps standard pairs (e.g., "EUR/USD" -> "EUR_USD").
  - Fetches historical candles from `api-fxpractice.oanda.com`.
  - Parses the JSON response into the standard OHLCV Pandas DataFrame.

#### `backend/app/main.py`
- In the `load_data()` function, add routing logic:
  - `if state.data_source == "Twelve Data":`
    - Check if `state.api_keys["twelve_data"]` exists.
    - If yes, call `download_twelvedata()`. If no, raise a clean error asking the user to enter the key in the Data Center.
  - `if state.data_source == "Oanda":`
    - Check if `state.api_keys["oanda"]` exists.
    - Call `download_oanda()`.

#### `backend/requirements.txt`
- Ensure `requests` is included for API calls if we choose to go with standard HTTP requests.

## Verification Plan
1. Open the UI, go to Data Center, and input a Twelve Data API Key.
2. Select "Twelve Data" from the Sidebar dropdown.
3. Verify the chart populates with live data and updates smoothly.
4. Repeat for Oanda with an fxTrade Practice token.
