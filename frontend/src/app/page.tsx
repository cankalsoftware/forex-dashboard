'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import LiveChart from '@/components/LiveChart';
import StatsCard from '@/components/StatsCard';
import DataCenter from '@/components/DataCenter';
import { ShieldAlert, Info } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

export default function Home() {
  // Global Application State
  const [config, setConfig] = useState({
    selected_pair: 'GBP/USD',
    selected_timeframe: '5-minute',
    selected_model_type: 'Fast',
    data_source: 'Yahoo Finance',
    api_keys: { twelve_data: '', oanda: '', alpha_vantage: '' },
    simulation_speed: 3,
    simulation_active: false,
    has_fast_model: true,
    has_detailed_model: false
  });

  const [trainStatus, setTrainStatus] = useState({
    status: 'idle',
    progress: { epoch: 0, train_loss: 0.0, val_loss: 0.0 },
    error: '',
    results: {} as any
  });

  const [candles, setCandles] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [prediction, setPrediction] = useState({
    direction: 'UP',
    probability_up: 0.5,
    current_price: 0
  });

  const wsRef = useRef<WebSocket | null>(null);

  // 1. Fetch History to initialize chart
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/history`);
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      setCandles(data);
      
      // Seed prediction initially
      let initialPrediction = {
        direction: 'NEUTRAL',
        probability_up: 0.5,
        current_price: data.length > 0 ? data[data.length - 1].close : 0
      };
      
      // Fetch initial forecast prediction
      try {
        const predRes = await fetch(`${BACKEND_URL}/api/predict`);
        if (predRes.ok) {
          const predData = await predRes.json();
          initialPrediction = {
            direction: predData.direction,
            probability_up: predData.probability_up,
            current_price: predData.current_price
          };
          setForecast(predData.forecast || []);
        } else {
          setForecast([]);
        }
      } catch (e) {
        console.error('Error fetching initial prediction:', e);
        setForecast([]);
      }
      
      setPrediction(initialPrediction);
    } catch (e) {
      console.error('Error fetching history:', e);
    }
  };

  // 2. Connect to WebSocket for real-time tickers and predictions
  const connectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    console.log('Connecting to WebSocket...');
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      
      switch (msg.type) {
        case 'INITIAL_STATE':
          setConfig(msg.data.config);
          setTrainStatus(msg.data.train_status);
          break;
          
        case 'TICK':
          const tickData = msg.data;
          
          // Update prediction info
          setPrediction({
            direction: tickData.prediction.direction,
            probability_up: tickData.prediction.probability_up,
            current_price: tickData.prediction.current_price
          });
          
          // Update forecasted dotted line
          setForecast(tickData.prediction.forecast);

          // Update candlesticks list
          setCandles((prevCandles) => {
            if (prevCandles.length === 0) return [tickData.candle];
            
            const lastCandle = prevCandles[prevCandles.length - 1];
            
            if (lastCandle.time === tickData.candle.time) {
              // Replace/update last candle with new ticks
              const updated = [...prevCandles];
              updated[updated.length - 1] = tickData.candle;
              return updated;
            } else {
              // New candle formed
              const updated = [...prevCandles, tickData.candle];
              // Keep length limited for charts performance
              if (updated.length > 400) {
                updated.shift();
              }
              return updated;
            }
          });
          break;
          
        case 'TRAINING_PROGRESS':
          setTrainStatus(prev => ({
            ...prev,
            status: 'training',
            progress: msg.data
          }));
          break;
          
        case 'TRAINING_COMPLETED':
          setTrainStatus(prev => ({
            ...prev,
            status: 'completed',
            results: msg.data
          }));
          // Trigger config fetch to update models status
          fetchConfig();
          break;
          
        case 'TRAINING_FAILED':
          setTrainStatus(prev => ({
            ...prev,
            status: 'error',
            error: msg.data.error
          }));
          break;
          
        case 'SIMULATION_ENDED':
          setConfig(prev => ({ ...prev, simulation_active: false }));
          break;
      }
    };

    ws.onclose = () => {
      console.log('WebSocket closed. Reconnecting in 3s...');
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/config`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.error('Error fetching config:', e);
    }
  };

  // Run on Mount
  useEffect(() => {
    connectWebSocket();
    fetchHistory();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // 3. User configuration update
  const handleConfigChange = async (newConfig: any) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (res.ok) {
        const updatedConfig = await res.json();
        setConfig(updatedConfig);
        
        // If pair, timeframe or source changed, reload chart history
        if (newConfig.selected_pair || newConfig.selected_timeframe || newConfig.data_source) {
          await fetchHistory();
        }
      }
    } catch (e) {
      console.error('Error updating config:', e);
    }
  };

  // 4. Handle Simulation Controls
  const handleSimulationAction = async (action: 'start' | 'stop' | 'reset') => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/simulation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        const status = await res.json();
        setConfig(prev => ({
          ...prev,
          simulation_active: action === 'start'
        }));
        
        if (action === 'reset') {
          fetchHistory();
        }
      }
    } catch (e) {
      console.error('Error in simulation action:', e);
    }
  };

  // 5. Trigger training
  const handleTrainModel = async () => {
    try {
      setTrainStatus(prev => ({ ...prev, status: 'training', progress: { epoch: 0, train_loss: 0, val_loss: 0 } }));
      const res = await fetch(`${BACKEND_URL}/api/train`, { method: 'POST' });
      if (!res.ok) throw new Error('Training request failed');
    } catch (e: any) {
      setTrainStatus(prev => ({ ...prev, status: 'error', error: e.message }));
    }
  };

  // 6. Handle CSV file upload
  const handleFileUpload = async (file: File, source: string): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`${BACKEND_URL}/api/upload-csv?source=${source}`, {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        await fetchHistory();
        return true;
      }
      return false;
    } catch (e) {
      console.error('CSV upload error:', e);
      return false;
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Main Header / Title Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/10 border border-slate-900/50 rounded-2xl p-5 backdrop-blur-xl glow-subtle">
          <div>
            <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-slate-50 to-slate-300 bg-clip-text text-transparent">
              Forex Predictor Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              ML-driven directional predictions, real-time indicators, and path forecasting.
            </p>
          </div>
          
          {/* Active Status metrics */}
          <div className="flex gap-4 text-xs">
            <div className="flex flex-col items-end">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Data Ticker</span>
              <span className="font-semibold text-slate-200 mt-0.5">{config.data_source}</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="flex flex-col items-end">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Active Model</span>
              <span className="font-semibold text-indigo-400 mt-0.5">{config.selected_model_type} Model</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="flex flex-col items-end">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Current Timeframe</span>
              <span className="font-semibold text-slate-200 mt-0.5">{config.selected_timeframe}</span>
            </div>
          </div>
        </div>

        {/* Info Notification if model not trained */}
        {config.selected_model_type === 'Detailed' && !config.has_detailed_model && (
          <div className="flex gap-2.5 items-center bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl px-4 py-3 text-xs leading-relaxed">
            <Info className="h-5 w-5 text-indigo-400 flex-shrink-0" />
            <span>
              <strong>Detailed Model (LSTM) has not been trained for this currency/timeframe yet.</strong> Falling back to the Fast model predictions. Click <strong>"Retrain Active Model"</strong> in the sidebar to train it.
            </span>
          </div>
        )}

        {/* Dashboard grid layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Config Sidebar */}
          <Sidebar
            config={config}
            onConfigChange={handleConfigChange}
            onSimulationAction={handleSimulationAction}
            onTrainModel={handleTrainModel}
            trainStatus={trainStatus}
          />

          {/* Interactive core section */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Real-time stats header */}
            <StatsCard
              prediction={prediction}
              metrics={trainStatus.results}
              latestCandle={candles.length > 0 ? candles[candles.length - 1] : {}}
              selectedPair={config.selected_pair}
            />

            {/* Live-updating chart widget */}
            <LiveChart
              candles={candles}
              forecast={forecast}
              selectedPair={config.selected_pair}
            />

            {/* Custom file parser & APIs configurations */}
            <DataCenter
              config={config}
              onConfigChange={handleConfigChange}
              onFileUpload={handleFileUpload}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
