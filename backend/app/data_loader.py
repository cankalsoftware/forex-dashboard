import os
import pandas as pd
import yfinance as yfinance_lib
from typing import Optional

# Map standard currency naming to Yahoo Finance tickers
YF_TICKERS = {
    "EUR/USD": "EURUSD=X",
    "GBP/USD": "GBPUSD=X",
    "USD/JPY": "USDJPY=X",
    "AUD/USD": "AUDUSD=X"
}

def get_yfinance_ticker(pair: str) -> str:
    return YF_TICKERS.get(pair, f"{pair.replace('/', '')}=X")

def download_yf_data(pair: str, interval: str, period: str = "1mo") -> pd.DataFrame:
    """
    Downloads historical data from Yahoo Finance.
    Interval options: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo
    Period options: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
    """
    ticker_symbol = get_yfinance_ticker(pair)
    
    # Map timeframe labels to Yahoo Finance intervals
    tf_map = {
        "1-minute": "1m",
        "5-minute": "5m",
        "1-hour": "1h",
        "Daily": "1d",
        "Weekly": "1wk"
    }
    
    yf_interval = tf_map.get(interval, interval)
    
    # Adjust default periods based on interval (Yahoo Finance restrictions)
    # e.g., 1m is only available for 7 days, 5m for 60 days.
    if yf_interval == "1m" and period not in ["1d", "5d", "7d"]:
        period = "7d"
    elif yf_interval in ["5m", "15m", "30m"] and period not in ["1d", "5d", "1mo", "60d"]:
        period = "60d"
    
    print(f"Downloading {ticker_symbol} with interval {yf_interval} for period {period}...")
    ticker = yfinance_lib.Ticker(ticker_symbol)
    df = ticker.history(period=period, interval=yf_interval)
    
    if df.empty:
        raise ValueError(f"No data returned for ticker {ticker_symbol} with interval {yf_interval} and period {period}")
        
    # Standardize columns and index
    df = df.reset_index()
    
    # Detect the datetime column (usually Date or Datetime)
    date_col = None
    for col in ['Date', 'Datetime', 'Date Time', 'index']:
        if col in df.columns:
            date_col = col
            break
            
    if date_col:
        df['Timestamp'] = pd.to_datetime(df[date_col], utc=True)
        df = df.drop(columns=[date_col])
    else:
        df['Timestamp'] = pd.to_datetime(df.iloc[:, 0], utc=True)
        
    df = df.set_index('Timestamp')
    
    # Ensure standard OHLCV columns exist
    df = df[['Open', 'High', 'Low', 'Close', 'Volume']]
    return df

def parse_custom_csv(file_path: str, source: str) -> pd.DataFrame:
    """
    Parses historical Forex data exported from different sources (Dukascopy, HistData, MetaTrader).
    Returns a standardized DataFrame index by Timestamp with Open, High, Low, Close, Volume.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"CSV file not found at {file_path}")
        
    print(f"Parsing CSV file {file_path} as {source} format...")
    
    # Try reading the file
    # Some files use semicolons, some use commas, some have no headers
    if source == "Dukascopy":
        # Format usually: Time,Open,High,Low,Close,Volume
        # Example time: "01.01.2023 00:00:00.000 GMT+0200" or "2023-01-01 00:00:00"
        df = pd.read_csv(file_path)
        # Rename columns to standard casing
        df.columns = [col.strip().capitalize() for col in df.columns]
        time_col = 'Time' if 'Time' in df.columns else df.columns[0]
        df['Timestamp'] = pd.to_datetime(df[time_col], utc=True)
        df = df.set_index('Timestamp')
        
    elif source == "HistData":
        # Format can be: 20230101 170000;1.069400;1.069500;1.069200;1.069500;0 (no header)
        # or Timestamp,Open,High,Low,Close,Volume
        try:
            # Let's inspect separators
            with open(file_path, 'r') as f:
                first_line = f.readline()
            sep = ';' if ';' in first_line else ','
            
            # Read CSV
            df = pd.read_csv(file_path, sep=sep, header=None if sep==';' or '20' in first_line.split(sep)[0] else 'infer')
            
            if len(df.columns) >= 5:
                if df.columns[0] == 0:  # No header
                    # Check if col 0 and 1 are Date and Time respectively, or merged
                    if len(str(df.iloc[0, 0])) == 8 and len(str(df.iloc[0, 1])) == 6: # YYYYMMDD HHMMSS
                        df['Timestamp'] = pd.to_datetime(df[0].astype(str) + ' ' + df[1].astype(str).str.zfill(6), format='%Y%m%d %H%M%S', utc=True)
                        df.columns = ['Date', 'Time', 'Open', 'High', 'Low', 'Close', 'Volume'] + list(df.columns[7:])
                    else:
                        # Single datetime column
                        df['Timestamp'] = pd.to_datetime(df[0], utc=True)
                        df.columns = ['Time', 'Open', 'High', 'Low', 'Close', 'Volume'] + list(df.columns[6:])
                else:
                    # Header exists
                    df.columns = [col.strip().capitalize() for col in df.columns]
                    time_col = df.columns[0]
                    df['Timestamp'] = pd.to_datetime(df[time_col], utc=True)
                
                df = df.set_index('Timestamp')
        except Exception as e:
            raise ValueError(f"Failed to parse HistData CSV: {str(e)}")
            
    elif source == "MetaTrader":
        # Format usually: YYYY.MM.DD,HH:MM,Open,High,Low,Close,Volume
        # or Date,Time,Open,High,Low,Close,Volume
        try:
            df = pd.read_csv(file_path)
            df.columns = [col.strip().capitalize() for col in df.columns]
            
            # Look for separate Date and Time columns
            if 'Date' in df.columns and 'Time' in df.columns:
                df['Timestamp'] = pd.to_datetime(df['Date'].astype(str) + ' ' + df['Time'].astype(str), utc=True)
            elif 'Datetime' in df.columns:
                df['Timestamp'] = pd.to_datetime(df['Datetime'], utc=True)
            else:
                # Fallback to first column
                df['Timestamp'] = pd.to_datetime(df.iloc[:, 0], utc=True)
                
            df = df.set_index('Timestamp')
        except Exception as e:
            raise ValueError(f"Failed to parse MetaTrader CSV: {str(e)}")
            
    else:
        # Default fallback
        df = pd.read_csv(file_path)
        df.columns = [col.strip().capitalize() for col in df.columns]
        df['Timestamp'] = pd.to_datetime(df.iloc[:, 0], utc=True)
        df = df.set_index('Timestamp')
        
    # Enforce standard columns
    standard_cols = ['Open', 'High', 'Low', 'Close']
    for col in standard_cols:
        if col not in df.columns:
            # Let's find columns that might match
            match = [c for c in df.columns if c.startswith(col[0].lower()) or c.startswith(col[0])]
            if match:
                df = df.rename(columns={match[0]: col})
            else:
                raise ValueError(f"Missing required column: {col}. Columns found: {list(df.columns)}")
                
    if 'Volume' not in df.columns:
        df['Volume'] = 0
        
    df = df[['Open', 'High', 'Low', 'Close', 'Volume']]
    return df.astype(float)
