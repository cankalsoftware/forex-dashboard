# Live API Integration Complete 🚀

I've successfully integrated both **Twelve Data** and **Oanda** into the application using lightweight HTTP `requests`!

## Changes Made
1. **Frontend**: The `Sidebar.tsx` has been updated so that "Twelve Data" and "Oanda" are now available in the main Data Source dropdown alongside Yahoo Finance and the custom CSV options.
2. **Backend Engine (`main.py`)**: The data routing logic has been expanded. When you select either of the new APIs, the backend will dynamically check your saved API keys and route to the new downloaders.
3. **Data Downloaders (`data_loader.py`)**: 
   - `download_twelvedata()` connects to their `time_series` endpoint.
   - `download_oanda()` connects to the `api-fxpractice.oanda.com` endpoint (ideal for your free testing token).
4. **Dependencies**: Confirmed `requests` is installed and documented in `requirements.txt`.

## How to Use It

### 1. Get Your Keys
- For **Twelve Data**, log into your account and copy the personal API key.
- For **Oanda**, ensure you've created an "fxTrade Practice" account and generate a personal access token.

### 2. Enter Keys in the App
- Open your Forex Dashboard.
- Navigate to the **Data Center** section.
- Switch to the **Live API Settings** tab.
- Paste your keys into the respective fields and click **Save API Credentials**.

### 3. Switch Live Data Source
- In the left **Sidebar**, change the Data Source dropdown from *Yahoo Finance* to either *Twelve Data (Live API)* or *Oanda (Live API)*.
- The system will immediately fetch up to 1,000 recent candles using your API key and map them correctly onto the chart!

> [!TIP]
> If you ever select Twelve Data or Oanda *without* saving an API key first, the backend will gracefully show an empty chart and a prompt rather than crashing or reverting to Yahoo Finance.

## MetaTrader 5 (MT5 Live app)

We have also added direct live integration to your local MetaTrader 5 terminal!

### 1. Requirements
- Ensure the official MetaTrader 5 terminal is installed and running on this computer.
- You must be logged into a broker account (demo or live).

### 2. How to Use It
- Open the Forex Dashboard.
- In the left **Sidebar**, simply select **MT5 Live app** from the Data Source dropdown.
- **No API keys are required!** The Python backend will securely and instantly talk to the MT5 application running in the background and pull live data.
