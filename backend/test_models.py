import pandas as pd
import numpy as np
import time
from app.data_loader import download_yf_data
from app.indicators import calculate_all_indicators
from app.models import FastForexModel, DetailedForexModel

def run_tests():
    print("=== STARTING BACKEND PIPELINE TESTS ===")
    
    # 1. Test data loader
    print("\n[1/4] Testing Yahoo Finance Download (EUR/USD, Daily, 60 days)...")
    try:
        df = download_yf_data("EUR/USD", "Daily", "1y")
        print(f"Success! Data shape: {df.shape}")
        print(f"Columns: {list(df.columns)}")
    except Exception as e:
        print(f"FAILED Data Download: {e}")
        return
        
    # 2. Test technical indicators
    print("\n[2/4] Testing Indicator Calculations...")
    try:
        df_indicators = calculate_all_indicators(df)
        print(f"Success! Processed data shape: {df_indicators.shape}")
        # Print some sample indicators to verify
        print(f"Sample columns with indicator data:\n{df_indicators[['Close', 'RSI', 'MACD', 'BB_Width', 'ATR']].tail(3)}")
    except Exception as e:
        print(f"FAILED Indicator Calculations: {e}")
        return
        
    # 3. Test Fast Model training and prediction
    print("\n[3/4] Testing Fast Forex Model (XGBoost/Ridge)...")
    try:
        fast_model = FastForexModel(forecast_horizon=5)
        train_results = fast_model.train(df_indicators)
        print(f"Success! Training results: {train_results}")
        
        # Test predictions
        prediction = fast_model.predict_next(df_indicators)
        print(f"Prediction output keys: {list(prediction.keys())}")
        print(f"Direction: {prediction['direction']}, Probability Up: {prediction['probability_up']}")
        print(f"Forecast prices (next 5 steps): {prediction['forecast_prices']}")
    except Exception as e:
        print(f"FAILED Fast Model: {e}")
        return
        
    # 4. Test Detailed Model training (short epochs) and prediction
    print("\n[4/4] Testing Detailed Forex Model (PyTorch LSTM)...")
    try:
        detailed_model = DetailedForexModel(forecast_horizon=5, seq_len=10)
        # Train for 2 epochs just to test
        train_results = detailed_model.train(df_indicators, epochs=2, batch_size=16)
        print(f"Success! LSTM Training results: {train_results}")
        
        prediction = detailed_model.predict_next(df_indicators)
        print(f"LSTM Prediction output keys: {list(prediction.keys())}")
        print(f"Forecast prices (next 5 steps): {prediction['forecast_prices']}")
    except Exception as e:
        print(f"FAILED Detailed Model: {e}")
        return
        
    print("\n=== ALL PIPELINE TESTS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    run_tests()
