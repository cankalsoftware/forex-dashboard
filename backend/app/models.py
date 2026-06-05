import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestClassifier
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import os
import pickle
import time
from typing import Tuple, Dict, Any, List, Callable, Optional

# Create models directory if it doesn't exist
os.makedirs("models_store", exist_ok=True)

class FastForexModel:
    """
    Fast Machine Learning Model utilizing Ridge Regression for price forecasting 
    and Random Forest for direction prediction.
    Training time: 1-5 seconds.
    """
    def __init__(self, forecast_horizon: int = 10):
        self.forecast_horizon = forecast_horizon
        self.regressor = Ridge(alpha=1.0)
        self.classifier = RandomForestClassifier(n_estimators=50, max_depth=8, random_state=42)
        self.scaler = StandardScaler()
        self.feature_cols = [
            'RSI', 'MACD', 'MACD_Signal', 'MACD_Hist', 
            'BB_Width', 'ATR', 'Return_Lag_1', 
            'Return_Lag_2', 'Return_Lag_3', 'Return_Lag_5'
        ]
        
    def prepare_data(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        # Drop rows with NaNs in feature columns
        df_clean = df.dropna(subset=self.feature_cols)
        
        X = df_clean[self.feature_cols].values
        y_reg = df_clean['Target_Return'].values
        y_clf = df_clean['Target_Class'].values
        
        # Note: the last row won't have a valid target (since it's in the future),
        # so for training we exclude it.
        return X[:-1], y_reg[:-1], y_clf[:-1]

    def train(self, df: pd.DataFrame) -> Dict[str, float]:
        start_time = time.time()
        
        X, y_reg, y_clf = self.prepare_data(df)
        if len(X) < 100:
            raise ValueError(f"Insufficient clean data for training: {len(X)} rows. Need at least 100.")
            
        # Fit scaler
        X_scaled = self.scaler.fit_transform(X)
        
        # Train Ridge Regressor for log returns
        self.regressor.fit(X_scaled, y_reg)
        
        # Train Random Forest for binary direction (Up/Down)
        self.classifier.fit(X_scaled, y_clf)
        
        training_time = time.time() - start_time
        
        # Basic validation scoring on the same data (for demo/status)
        reg_score = self.regressor.score(X_scaled, y_reg)
        clf_acc = self.classifier.score(X_scaled, y_clf)
        
        # Save model state
        self.save()
        
        return {
            "training_time": training_time,
            "regression_r2": float(reg_score),
            "classifier_accuracy": float(clf_acc)
        }

    def predict_next(self, current_df: pd.DataFrame) -> Dict[str, Any]:
        """
        Predicts the next direction and the next H candle prices (returns path).
        """
        # Get the very last row for features
        last_row = current_df.dropna(subset=self.feature_cols).tail(1)
        if last_row.empty:
            raise ValueError("Insufficient data to extract real-time features for prediction.")
            
        last_close = float(last_row['Close'].values[0])
        last_atr = float(last_row['ATR'].values[0])
        
        X_last = last_row[self.feature_cols].values
        X_last_scaled = self.scaler.transform(X_last)
        
        # 1. Direction prediction (Up/Down probability)
        dir_probs = self.classifier.predict_proba(X_last_scaled)[0]
        up_prob = float(dir_probs[1])
        
        # 2. Multi-step autoregressive price path prediction
        # For a fast baseline, we can project forward using the expected return and ATR-based volatility bounds.
        # We also decay the return prediction towards 0 (mean reversion/random walk assumption) to prevent extreme spirals.
        predicted_returns = []
        temp_features = last_row[self.feature_cols].copy()
        
        current_price = last_close
        predicted_prices = []
        upper_bounds = []
        lower_bounds = []
        
        # Scale of uncertainty increases with square root of time
        for step in range(1, self.forecast_horizon + 1):
            # Scale features and predict next log return
            X_temp = temp_features[self.feature_cols].values
            X_temp_scaled = self.scaler.transform(X_temp)
            pred_return = float(self.regressor.predict(X_temp_scaled)[0])
            
            # Dampen prediction step-by-step
            dampened_return = pred_return * (0.8 ** step)
            predicted_returns.append(dampened_return)
            
            # Calculate predicted price
            current_price = current_price * np.exp(dampened_return)
            predicted_prices.append(current_price)
            
            # Confidence interval corridor (using ATR and step sqrt)
            volatility_envelope = 1.5 * last_atr * np.sqrt(step)
            upper_bounds.append(current_price + volatility_envelope)
            lower_bounds.append(current_price - volatility_envelope)
            
            # Shift technical features simulating the next candle
            # For the lag features, we shift them
            temp_features['Return_Lag_5'] = temp_features['Return_Lag_3']
            temp_features['Return_Lag_3'] = temp_features['Return_Lag_2']
            temp_features['Return_Lag_2'] = temp_features['Return_Lag_1']
            temp_features['Return_Lag_1'] = dampened_return
            
        return {
            "direction": "UP" if up_prob >= 0.5 else "DOWN",
            "probability_up": up_prob,
            "current_price": last_close,
            "forecast_prices": predicted_prices,
            "upper_corridor": upper_bounds,
            "lower_corridor": lower_bounds
        }

    def save(self):
        with open("models_store/fast_model.pkl", "wb") as f:
            pickle.dump(self, f)

    @classmethod
    def load(cls) -> 'FastForexModel':
        if not os.path.exists("models_store/fast_model.pkl"):
            return cls()
        with open("models_store/fast_model.pkl", "rb") as f:
            return pickle.load(f)


# --- PyTorch LSTM Model Implementation ---

class LSTMNet(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int, num_layers: int, output_dim: int):
        super(LSTMNet, self).__init__()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True, dropout=0.2 if num_layers > 1 else 0.0)
        self.fc = nn.Linear(hidden_dim, output_dim)
        
    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim).to(x.device)
        out, _ = self.lstm(x, (h0, c0))
        out = self.fc(out[:, -1, :])  # Take only the last sequence output
        return out


class DetailedForexModel:
    """
    Detailed Sequence model using PyTorch LSTM.
    Processes past sequences to predict future H steps at once.
    Training time: 1-3 minutes.
    """
    def __init__(self, forecast_horizon: int = 10, seq_len: int = 30):
        self.forecast_horizon = forecast_horizon
        self.seq_len = seq_len
        self.input_dim = 6  # Log_Return, RSI, MACD, BB_Width, ATR, Close (normalized)
        self.hidden_dim = 64
        self.num_layers = 2
        self.net = LSTMNet(self.input_dim, self.hidden_dim, self.num_layers, self.forecast_horizon)
        self.scaler = StandardScaler()
        self.feature_cols = ['Log_Return', 'RSI', 'MACD', 'BB_Width', 'ATR', 'Close']
        self.trained = False

    def create_sequences(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        # Drop initial NaNs
        df_clean = df.dropna(subset=self.feature_cols).copy()
        
        # Fit scaler on features
        scaled_data = self.scaler.fit_transform(df_clean[self.feature_cols].values)
        
        # Targets are future log returns for H steps
        # df['Log_Return'].shift(-1), shift(-2), ..., shift(-H)
        targets = []
        for i in range(1, self.forecast_horizon + 1):
            targets.append(df_clean['Log_Return'].shift(-i).values)
            
        targets = np.column_stack(targets)
        
        X_seq = []
        y_seq = []
        
        # Build rolling sequences
        for i in range(len(df_clean) - self.seq_len - self.forecast_horizon + 1):
            X_seq.append(scaled_data[i : i + self.seq_len])
            y_seq.append(targets[i + self.seq_len - 1])
            
        return np.array(X_seq), np.array(y_seq)

    def train(self, df: pd.DataFrame, epochs: int = 15, batch_size: int = 64, progress_callback: Optional[Callable[[int, float, float], None]] = None) -> Dict[str, float]:
        """
        Trains the LSTM model. If progress_callback is provided, it streams the current epoch and loss metrics.
        """
        start_time = time.time()
        
        # Limit data size if timeframe is very short (1m, 5m) to keep training fast
        # Let's keep the last 5000 candles max
        if len(df) > 5000:
            df = df.tail(5000)
            
        X, y = self.create_sequences(df)
        if len(X) < 100:
            raise ValueError(f"Insufficient sequence data: {len(X)} sequences. Need at least 100.")
            
        # Train/Val split
        split = int(0.8 * len(X))
        X_train, X_val = X[:split], X[split:]
        y_train, y_val = y[:split], y[split:]
        
        # Convert to PyTorch Tensors
        train_dataset = TensorDataset(torch.FloatTensor(X_train), torch.FloatTensor(y_train))
        val_dataset = TensorDataset(torch.FloatTensor(X_val), torch.FloatTensor(y_val))
        
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
        
        # Set up optimizer and loss
        optimizer = optim.Adam(self.net.parameters(), lr=0.001)
        criterion = nn.MSELoss()
        
        # Re-initialize network to reset weights
        self.net = LSTMNet(self.input_dim, self.hidden_dim, self.num_layers, self.forecast_horizon)
        
        print("Training LSTM network...")
        best_val_loss = float('inf')
        
        for epoch in range(1, epochs + 1):
            self.net.train()
            train_loss = 0.0
            for batch_x, batch_y in train_loader:
                optimizer.zero_grad()
                pred = self.net(batch_x)
                loss = criterion(pred, batch_y)
                loss.backward()
                optimizer.step()
                train_loss += loss.item() * batch_x.size(0)
                
            train_loss /= len(X_train)
            
            # Validation loss
            self.net.eval()
            val_loss = 0.0
            with torch.no_grad():
                for batch_x, batch_y in val_loader:
                    pred = self.net(batch_x)
                    loss = criterion(pred, batch_y)
                    val_loss += loss.item() * batch_x.size(0)
            val_loss /= len(X_val)
            
            print(f"Epoch {epoch}/{epochs} | Train Loss: {train_loss:.6f} | Val Loss: {val_loss:.6f}")
            
            # Call progress report callback
            if progress_callback:
                progress_callback(epoch, float(train_loss), float(val_loss))
                
        training_time = time.time() - start_time
        self.trained = True
        
        # Save model
        self.save()
        
        return {
            "training_time": training_time,
            "final_train_loss": train_loss,
            "final_val_loss": val_loss
        }

    def predict_next(self, current_df: pd.DataFrame) -> Dict[str, Any]:
        """
        Feeds the last window of size seq_len to predict the next H candles returns.
        """
        # Extract features
        df_clean = current_df.dropna(subset=self.feature_cols).copy()
        if len(df_clean) < self.seq_len:
            raise ValueError(f"Insufficient historical data ({len(df_clean)} candles) to make sequence forecast. Need at least {self.seq_len}.")
            
        last_window = df_clean[self.feature_cols].tail(self.seq_len).values
        last_close = float(df_clean['Close'].values[-1])
        last_atr = float(df_clean['ATR'].values[-1])
        
        # Scale window
        last_window_scaled = self.scaler.transform(last_window)
        
        # Reshape for PyTorch input: [batch_size=1, seq_len, input_dim]
        input_tensor = torch.FloatTensor(last_window_scaled).unsqueeze(0)
        
        self.net.eval()
        with torch.no_grad():
            pred_returns_tensor = self.net(input_tensor)
            predicted_returns = pred_returns_tensor.numpy()[0]
            
        # Reconstruct price path from returns
        predicted_prices = []
        current_price = last_close
        upper_bounds = []
        lower_bounds = []
        
        for step, ret in enumerate(predicted_returns, 1):
            current_price = current_price * np.exp(ret)
            predicted_prices.append(current_price)
            
            # Set confidence corridor
            volatility_envelope = 1.5 * last_atr * np.sqrt(step)
            upper_bounds.append(current_price + volatility_envelope)
            lower_bounds.append(current_price - volatility_envelope)
            
        # Directional prediction based on first forecasted step's direction
        prob_up = 1.0 if predicted_returns[0] > 0 else 0.0
        
        return {
            "direction": "UP" if predicted_returns[0] > 0 else "DOWN",
            "probability_up": prob_up,
            "current_price": last_close,
            "forecast_prices": predicted_prices,
            "upper_corridor": upper_bounds,
            "lower_corridor": lower_bounds
        }

    def save(self):
        # Save state dictionary and other variables
        state = {
            "net_state_dict": self.net.state_dict(),
            "scaler": self.scaler,
            "trained": self.trained,
            "forecast_horizon": self.forecast_horizon,
            "seq_len": self.seq_len,
            "input_dim": self.input_dim,
            "hidden_dim": self.hidden_dim,
            "num_layers": self.num_layers
        }
        with open("models_store/detailed_model.pt", "wb") as f:
            torch.save(state, f)

    def load(self):
        path = "models_store/detailed_model.pt"
        if not os.path.exists(path):
            return
        state = torch.load(path)
        self.scaler = state["scaler"]
        self.trained = state["trained"]
        self.forecast_horizon = state["forecast_horizon"]
        self.seq_len = state["seq_len"]
        self.input_dim = state["input_dim"]
        self.hidden_dim = state["hidden_dim"]
        self.num_layers = state["num_layers"]
        
        self.net = LSTMNet(self.input_dim, self.hidden_dim, self.num_layers, self.forecast_horizon)
        self.net.load_state_dict(state["net_state_dict"])
