import pandas as pd
import numpy as np

def calculate_all_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculates technical indicators on the given DataFrame.
    Expected columns in df: Open, High, Low, Close, Volume.
    Modifies df in-place or returns a copy with the indicators added.
    """
    df = df.copy()
    
    # Ensure correct column naming (sometimes it is lowercase or has whitespace)
    df.columns = [col.strip().capitalize() for col in df.columns]
    
    # Check if necessary columns exist
    required_cols = ['Open', 'High', 'Low', 'Close']
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")
            
    close = df['Close']
    high = df['High']
    low = df['Low']
    
    # 1. Moving Averages
    df['EMA_9'] = close.ewm(span=9, adjust=False).mean()
    df['EMA_21'] = close.ewm(span=21, adjust=False).mean()
    df['SMA_50'] = close.rolling(window=50).mean()
    df['SMA_200'] = close.rolling(window=200).mean()
    
    # 2. RSI (14)
    delta = close.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / (loss + 1e-10)
    df['RSI'] = 100 - (100 / (1 + rs))
    
    # 3. MACD (12, 26, 9)
    exp12 = close.ewm(span=12, adjust=False).mean()
    exp26 = close.ewm(span=26, adjust=False).mean()
    df['MACD'] = exp12 - exp26
    df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
    df['MACD_Hist'] = df['MACD'] - df['MACD_Signal']
    
    # 4. Bollinger Bands (20, 2)
    df['BB_Middle'] = close.rolling(window=20).mean()
    bb_std = close.rolling(window=20).std()
    df['BB_Upper'] = df['BB_Middle'] + (bb_std * 2)
    df['BB_Lower'] = df['BB_Middle'] - (bb_std * 2)
    df['BB_Width'] = (df['BB_Upper'] - df['BB_Lower']) / (df['BB_Middle'] + 1e-10)
    
    # 5. ATR (Average True Range) (14)
    tr1 = high - low
    tr2 = abs(high - close.shift(1))
    tr3 = abs(low - close.shift(1))
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    df['ATR'] = tr.rolling(window=14).mean()
    
    # 6. Returns and Lag Features
    # Log returns
    df['Log_Return'] = np.log(close / close.shift(1))
    
    # Lags of Log Returns
    df['Return_Lag_1'] = df['Log_Return'].shift(1)
    df['Return_Lag_2'] = df['Log_Return'].shift(2)
    df['Return_Lag_3'] = df['Log_Return'].shift(3)
    df['Return_Lag_5'] = df['Log_Return'].shift(5)
    
    # 7. Target variables (for training)
    # Target: Return of next candle
    df['Target_Return'] = df['Log_Return'].shift(-1)
    # Target: Class (1 if next close > current close, 0 otherwise)
    df['Target_Class'] = (close.shift(-1) > close).astype(int)
    
    # Drop rows with NaN (due to rolling windows and lags)
    # We don't drop rows with Target_Return or Target_Class if we are predicting the last candle,
    # but for training we drop them. Let's handle NaN dropping inside the model trainer, not here.
    
    return df
