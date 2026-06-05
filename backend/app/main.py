import os
import shutil
import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, BackgroundTasks, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
import time

from app.data_loader import download_yf_data, parse_custom_csv
from app.indicators import calculate_all_indicators
from app.models import FastForexModel, DetailedForexModel

app = FastAPI(title="Forex Prediction API")

# Enable CORS for Next.js frontend (default port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global State Container
class AppState:
    def __init__(self):
        self.selected_pair = "GBP/USD"
        self.selected_timeframe = "5-minute"
        self.selected_model_type = "Fast"  # "Fast" or "Detailed"
        self.data_source = "Yahoo Finance"  # "Yahoo Finance", "Dukascopy", "HistData", "MetaTrader"
        self.custom_file_path = None
        self.api_keys = {
            "twelve_data": "",
            "oanda": "",
            "alpha_vantage": ""
        }
        
        # Data storage
        self.raw_df: Optional[pd.DataFrame] = None
        self.processed_df: Optional[pd.DataFrame] = None
        
        # Models
        self.fast_model = FastForexModel.load()
        self.detailed_model = DetailedForexModel()
        try:
            self.detailed_model.load()
        except Exception:
            pass  # Detailed model pt file might not exist yet
            
        # Training state
        self.training_status = "idle"  # "idle", "training", "completed", "error"
        self.training_progress = {"epoch": 0, "train_loss": 0.0, "val_loss": 0.0}
        self.training_error = ""
        self.training_results = {}
        
        # Simulation state
        self.simulation_active = False
        self.simulation_index = 0
        self.simulation_speed = 3.0  # seconds per tick
        self.simulation_task: Optional[asyncio.Task] = None
        
        # Connected WebSocket clients
        self.clients: List[WebSocket] = []

state = AppState()

# Pydantic schemas for requests
class ConfigUpdate(BaseModel):
    selected_pair: Optional[str] = None
    selected_timeframe: Optional[str] = None
    selected_model_type: Optional[str] = None
    data_source: Optional[str] = None
    api_keys: Optional[Dict[str, str]] = None
    simulation_speed: Optional[float] = None

class SimulationControl(BaseModel):
    action: str  # "start", "stop", "reset"

# Initialize Data helper
def load_data():
    """Loads historical data based on current configurations."""
    try:
        if state.data_source == "Yahoo Finance":
            # Map intervals to standard periods
            period = "60d"  # default for 5m
            if state.selected_timeframe == "1-minute":
                period = "7d"
            elif state.selected_timeframe == "1-hour":
                period = "1y"
            elif state.selected_timeframe in ["Daily", "Weekly"]:
                period = "5y"
                
            df = download_yf_data(state.selected_pair, state.selected_timeframe, period)
            state.raw_df = df
            state.processed_df = calculate_all_indicators(df)
            state.custom_file_path = None
        elif state.custom_file_path and os.path.exists(state.custom_file_path):
            df = parse_custom_csv(state.custom_file_path, state.data_source)
            state.raw_df = df
            state.processed_df = calculate_all_indicators(df)
        else:
            # Fallback to default Yahoo Finance if no custom file uploaded yet
            state.data_source = "Yahoo Finance"
            load_data()
    except Exception as e:
        print(f"Error loading data: {e}")
        # Default empty fallback
        raise HTTPException(status_code=400, detail=str(e))

@app.on_event("startup")
async def startup_event():
    # Attempt initial data load
    try:
        load_data()
    except Exception as e:
        print(f"Initial startup data load failed: {e}. Will load on demand.")

# REST Endpoints

@app.get("/api/config")
def get_config():
    return {
        "selected_pair": state.selected_pair,
        "selected_timeframe": state.selected_timeframe,
        "selected_model_type": state.selected_model_type,
        "data_source": state.data_source,
        "api_keys": state.api_keys,
        "simulation_speed": state.simulation_speed,
        "simulation_active": state.simulation_active,
        "has_fast_model": True, # Always loaded/fallback exists
        "has_detailed_model": state.detailed_model.trained
    }

@app.post("/api/config")
def update_config(config: ConfigUpdate):
    if config.selected_pair is not None:
        state.selected_pair = config.selected_pair
    if config.selected_timeframe is not None:
        state.selected_timeframe = config.selected_timeframe
    if config.selected_model_type is not None:
        state.selected_model_type = config.selected_model_type
    if config.data_source is not None:
        state.data_source = config.data_source
    if config.api_keys is not None:
        state.api_keys.update(config.api_keys)
    if config.simulation_speed is not None:
        state.simulation_speed = config.simulation_speed
        
    # Re-load data if pair, timeframe or source changes
    if any(x is not None for x in [config.selected_pair, config.selected_timeframe, config.data_source]):
        try:
            # Stop active simulation if changing settings
            if state.simulation_active:
                stop_simulation_task()
            load_data()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to load data for new config: {str(e)}")
            
    return get_config()

@app.get("/api/history")
def get_history():
    if state.processed_df is None:
        load_data()
    if state.processed_df is None or state.processed_df.empty:
        return []
        
    # Return last 300 candles for chart visualization
    chart_df = state.processed_df.tail(300).copy()
    
    # Prepare standard TradingView format: time (epoch in sec), open, high, low, close, volume
    candles = []
    for idx, row in chart_df.iterrows():
        # check if index is timezone-aware
        t_val = int(idx.timestamp())
        candles.append({
            "time": t_val,
            "open": float(row["Open"]),
            "high": float(row["High"]),
            "low": float(row["Low"]),
            "close": float(row["Close"]),
            "volume": float(row["Volume"]),
            "rsi": float(row["RSI"]) if not np.isnan(row["RSI"]) else None,
            "atr": float(row["ATR"]) if not np.isnan(row["ATR"]) else None,
        })
    return candles

@app.get("/api/predict")
def get_prediction():
    if state.processed_df is None or state.processed_df.empty:
        load_data()
    if state.processed_df is None or state.processed_df.empty:
        raise HTTPException(status_code=400, detail="No data available to run prediction.")
        
    sim_df = state.processed_df.copy()
    last_candle_idx = sim_df.index[-1]
    last_row = sim_df.iloc[-1]
    
    prediction = {}
    try:
        if state.selected_model_type == "Fast":
            prediction = state.fast_model.predict_next(sim_df)
        else:
            if not state.detailed_model.trained:
                prediction = state.fast_model.predict_next(sim_df)
            else:
                prediction = state.detailed_model.predict_next(sim_df)
    except Exception as pe:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(pe)}")
        
    tf_delta_seconds = {
        "1-minute": 60,
        "5-minute": 300,
        "1-hour": 3600,
        "Daily": 86400,
        "Weekly": 604800
    }.get(state.selected_timeframe, 300)
    
    forecast_data = []
    forecast_candles = []
    if "forecast_prices" in prediction:
        prices = prediction["forecast_prices"]
        last_c = prediction["current_price"]
        last_atr = float(sim_df["ATR"].iloc[-1]) if "ATR" in sim_df.columns and not np.isnan(sim_df["ATR"].iloc[-1]) else 0.001
        
        for i in range(len(prices)):
            f_time = int(last_candle_idx.timestamp()) + (i + 1) * tf_delta_seconds
            
            forecast_data.append({
                "time": f_time,
                "value": prices[i],
                "upper": prediction["upper_corridor"][i],
                "lower": prediction["lower_corridor"][i]
            })
            
            o_val = last_c if i == 0 else prices[i - 1]
            c_val = prices[i]
            wick_expansion = 0.35 * last_atr * np.sqrt(i + 1)
            h_val = max(o_val, c_val) + wick_expansion
            l_val = min(o_val, c_val) - wick_expansion
            
            forecast_candles.append({
                "time": f_time,
                "open": o_val,
                "high": h_val,
                "low": l_val,
                "close": c_val
            })
            
    return {
        "direction": prediction.get("direction", "NEUTRAL"),
        "probability_up": prediction.get("probability_up", 0.5),
        "current_price": prediction.get("current_price", float(last_row["Close"])),
        "forecast": forecast_data,
        "forecast_candles": forecast_candles
    }

@app.post("/api/upload-csv")
async def upload_csv(source: str = Query(..., enum=["Dukascopy", "HistData", "MetaTrader"]), file: UploadFile = File(...)):
    os.makedirs("data", exist_ok=True)
    file_path = f"data/uploaded_{source.lower()}.csv"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    state.custom_file_path = file_path
    state.data_source = source
    
    try:
        load_data()
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        state.custom_file_path = None
        state.data_source = "Yahoo Finance"
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")
        
    return {"message": f"Successfully uploaded and parsed {source} data file.", "config": get_config()}

# ML Training Thread Runner

def run_training_job():
    try:
        state.training_status = "training"
        state.training_error = ""
        state.training_progress = {"epoch": 0, "train_loss": 0.0, "val_loss": 0.0}
        
        # Make sure we have latest indicators calculated
        if state.processed_df is None or len(state.processed_df) < 200:
            load_data()
            
        df = state.processed_df
        
        if state.selected_model_type == "Fast":
            results = state.fast_model.train(df)
            state.training_results = results
            state.training_status = "completed"
        else:
            # PyTorch LSTM
            def progress_hook(epoch, train_loss, val_loss):
                state.training_progress = {
                    "epoch": epoch,
                    "train_loss": train_loss,
                    "val_loss": val_loss
                }
                # Broadcast progress via WebSockets to connected clients
                asyncio.run(broadcast_message({
                    "type": "TRAINING_PROGRESS",
                    "data": {
                        "epoch": epoch,
                        "epochs_total": 15,
                        "train_loss": train_loss,
                        "val_loss": val_loss
                    }
                }))
                
            results = state.detailed_model.train(df, epochs=15, progress_callback=progress_hook)
            state.training_results = results
            state.training_status = "completed"
            
        # Notify clients training finished
        asyncio.run(broadcast_message({
            "type": "TRAINING_COMPLETED",
            "data": state.training_results
        }))
        
    except Exception as e:
        state.training_status = "error"
        state.training_error = str(e)
        print(f"Training error: {e}")
        asyncio.run(broadcast_message({
            "type": "TRAINING_FAILED",
            "data": {"error": str(e)}
        }))

@app.post("/api/train")
def trigger_training(background_tasks: BackgroundTasks):
    if state.training_status == "training":
        raise HTTPException(status_code=400, detail="Training already in progress")
        
    background_tasks.add_task(run_training_job)
    return {"message": "Training started in background.", "status": "training"}

@app.get("/api/train-status")
def get_train_status():
    return {
        "status": state.training_status,
        "progress": state.training_progress,
        "error": state.training_error,
        "results": state.training_results
    }

# Simulation Control

def stop_simulation_task():
    state.simulation_active = False
    if state.simulation_task:
        state.simulation_task.cancel()
        state.simulation_task = None

async def run_simulation_loop():
    try:
        # Load simulation starting data
        if state.processed_df is None or state.processed_df.empty:
            load_data()
            
        total_rows = len(state.processed_df)
        if total_rows < 100:
            print("Not enough data to run simulation")
            state.simulation_active = False
            return
            
        # Start simulation from the last 50 candles (giving historical context on chart)
        state.simulation_index = max(100, total_rows - 50)
        
        while state.simulation_active and state.simulation_index < total_rows:
            # Segment df up to the current simulation index
            sim_df = state.processed_df.iloc[:state.simulation_index].copy()
            
            # Last candle info
            last_candle_idx = sim_df.index[-1]
            last_row = sim_df.iloc[-1]
            
            # Predict next using active model
            prediction = {}
            try:
                if state.selected_model_type == "Fast":
                    prediction = state.fast_model.predict_next(sim_df)
                else:
                    if not state.detailed_model.trained:
                        # Fallback to fast model if detailed not trained yet
                        prediction = state.fast_model.predict_next(sim_df)
                    else:
                        prediction = state.detailed_model.predict_next(sim_df)
            except Exception as pe:
                print(f"Prediction failed inside simulator: {pe}")
                
            # Forecast prices mapping (times)
            # Create future timestamps for dotted line prediction based on timeframe
            tf_delta_seconds = {
                "1-minute": 60,
                "5-minute": 300,
                "1-hour": 3600,
                "Daily": 86400,
                "Weekly": 604800
            }.get(state.selected_timeframe, 300)
            
            forecast_data = []
            forecast_candles = []
            if "forecast_prices" in prediction:
                prices = prediction["forecast_prices"]
                last_c = prediction["current_price"]
                last_atr = float(sim_df["ATR"].iloc[-1]) if "ATR" in sim_df.columns and not np.isnan(sim_df["ATR"].iloc[-1]) else 0.001
                
                for i, price in enumerate(prices):
                    f_time = int(last_candle_idx.timestamp()) + (i + 1) * tf_delta_seconds
                    
                    forecast_data.append({
                        "time": f_time,
                        "value": price,
                        "upper": prediction["upper_corridor"][i],
                        "lower": prediction["lower_corridor"][i]
                    })
                    
                    o_val = last_c if i == 0 else prices[i - 1]
                    c_val = price
                    wick_expansion = 0.35 * last_atr * np.sqrt(i + 1)
                    h_val = max(o_val, c_val) + wick_expansion
                    l_val = min(o_val, c_val) - wick_expansion
                    
                    forecast_candles.append({
                        "time": f_time,
                        "open": o_val,
                        "high": h_val,
                        "low": l_val,
                        "close": c_val
                    })
            
            payload = {
                "type": "TICK",
                "data": {
                    "candle": {
                        "time": int(last_candle_idx.timestamp()),
                        "open": float(last_row["Open"]),
                        "high": float(last_row["High"]),
                        "low": float(last_row["Low"]),
                        "close": float(last_row["Close"]),
                        "volume": float(last_row["Volume"]),
                        "rsi": float(last_row["RSI"]) if not np.isnan(last_row["RSI"]) else None,
                        "atr": float(last_row["ATR"]) if not np.isnan(last_row["ATR"]) else None
                    },
                    "prediction": {
                        "direction": prediction.get("direction", "NEUTRAL"),
                        "probability_up": prediction.get("probability_up", 0.5),
                        "current_price": prediction.get("current_price", float(last_row["Close"])),
                        "forecast": forecast_data,
                        "forecast_candles": forecast_candles
                    }
                }
            }
            
            await broadcast_message(payload)
            
            # Step forward
            state.simulation_index += 1
            await asyncio.sleep(state.simulation_speed)
            
        state.simulation_active = False
        print("Simulation ended (reached end of dataset)")
        await broadcast_message({"type": "SIMULATION_ENDED"})
        
    except asyncio.CancelledError:
        print("Simulation loop cancelled")
    except Exception as e:
        print(f"Simulation error: {e}")
        state.simulation_active = False

@app.post("/api/simulation")
def control_simulation(control: SimulationControl):
    if control.action == "start":
        if state.simulation_active:
            return {"status": "running"}
        state.simulation_active = True
        state.simulation_task = asyncio.create_task(run_simulation_loop())
        return {"status": "started"}
    elif control.action == "stop":
        stop_simulation_task()
        return {"status": "stopped"}
    elif control.action == "reset":
        stop_simulation_task()
        state.simulation_index = 0
        return {"status": "reset"}
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

# WebSocket Broadcasting Coordinator

async def broadcast_message(message: dict):
    if not state.clients:
        return
    payload_str = json.dumps(message)
    dead_clients = []
    for client in state.clients:
        try:
            await client.send_text(payload_str)
        except Exception:
            dead_clients.append(client)
            
    for dc in dead_clients:
        if dc in state.clients:
            state.clients.remove(dc)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    state.clients.append(websocket)
    print(f"WebSocket client connected. Total clients: {len(state.clients)}")
    
    # Send initial configuration update
    await websocket.send_text(json.dumps({
        "type": "INITIAL_STATE",
        "data": {
            "config": get_config(),
            "train_status": get_train_status()
        }
    }))
    
    try:
        while True:
            # Keep connection alive & handle incoming requests if any
            data = await websocket.receive_text()
            # Simple ping-pong
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        print("WebSocket client disconnected")
    finally:
        if websocket in state.clients:
            state.clients.remove(websocket)
