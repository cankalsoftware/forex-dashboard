import React from 'react';
import { 
  Cpu, 
  Database, 
  Clock, 
  Play, 
  Square, 
  RotateCcw, 
  RefreshCw,
  TrendingUp,
  Sliders,
  DollarSign,
  Info
} from 'lucide-react';

interface SidebarProps {
  config: {
    selected_pair: string;
    selected_timeframe: string;
    selected_model_type: string;
    data_source: string;
    simulation_speed: number;
    simulation_active: boolean;
    has_fast_model: boolean;
    has_detailed_model: boolean;
    history_lookback: string;
  };
  onConfigChange: (newConfig: any) => void;
  onSimulationAction: (action: 'start' | 'stop' | 'reset') => void;
  onTrainModel: () => void;
  trainStatus: {
    status: string;
    progress: { epoch: number; train_loss: number; val_loss: number };
    error: string;
    results: any;
  };
}

export default function Sidebar({ 
  config, 
  onConfigChange, 
  onSimulationAction, 
  onTrainModel,
  trainStatus
}: SidebarProps) {
  
  const currencyPairs = ['GBP/USD', 'EUR/USD', 'USD/JPY', 'AUD/USD'];
  const timeframes = ['1-second', '3-second', '5-second', '10-second', '30-second', '1-minute', '5-minute', '1-hour', 'Daily', 'Weekly'];
  const models = [
    { name: 'Fast', desc: 'XGBoost/Ridge (Takes 1-5s)' },
    { name: 'Detailed', desc: 'PyTorch LSTM (Takes 1-3m)' }
  ];
  const sources = ['Yahoo Finance', 'Twelve Data', 'Oanda', 'Dukascopy', 'HistData', 'MetaTrader'];
  const lookbacks = ['1 Day', '5 Days', '1 Month', '3 Months', '6 Months', '1 Year', 'Max'];

  const getStatusBadge = () => {
    switch (trainStatus.status) {
      case 'training':
        return <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded animate-pulse">Training...</span>;
      case 'completed':
        return <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">Ready</span>;
      case 'error':
        return <span className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded">Error</span>;
      default:
        return <span className="text-xs bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded">Idle</span>;
    }
  };

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/30 p-4 backdrop-blur-xl glow-subtle">
      {/* App Header / Brand */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800/60">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-md font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Antigravity Forex</h1>
          <p className="text-xs text-indigo-400 font-medium tracking-wide uppercase">ML Predictive Engine</p>
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="flex flex-col gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/60">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Sliders className="h-3.5 w-3.5" /> Market Parameters
        </h3>

        {/* Currency Pair */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-slate-500" /> Currency Pair</label>
          <select 
            value={config.selected_pair} 
            onChange={(e) => onConfigChange({ selected_pair: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {currencyPairs.map(pair => (
              <option key={pair} value={pair}>{pair}</option>
            ))}
          </select>
        </div>

        {/* Timeframe */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-500" /> Timeframe</label>
          <select 
            value={config.selected_timeframe} 
            onChange={(e) => onConfigChange({ selected_timeframe: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {timeframes.map(tf => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
        </div>

        {/* History Lookback */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 flex items-center gap-1.5"><RotateCcw className="h-3.5 w-3.5 text-slate-500" /> History Lookback</label>
          <select 
            value={config.history_lookback || '1 Month'} 
            onChange={(e) => onConfigChange({ history_lookback: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {lookbacks.map(lb => (
              <option key={lb} value={lb}>{lb}</option>
            ))}
          </select>
        </div>

        {/* Data Source */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-400 flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-slate-500" /> Data Source</label>
            <div className="group relative">
              <Info className="h-3.5 w-3.5 text-slate-500 cursor-help" />
              <div className="absolute right-0 top-5 w-64 p-3 bg-slate-800 text-[10px] text-slate-300 rounded-lg shadow-xl border border-slate-700 hidden group-hover:block z-50">
                <p className="mb-1"><strong className="text-slate-100">Dukascopy:</strong> Highly accurate tick, minute, and hourly data.</p>
                <p className="mb-1"><strong className="text-slate-100">HistData:</strong> Free historical tick-by-tick, 1-minute CSV files.</p>
                <p className="mb-1"><strong className="text-slate-100">MetaTrader:</strong> Built-in Strategy Tester history centers.</p>
                <p><strong className="text-slate-100">Yahoo Finance:</strong> Excellent for daily and weekly exchange rate history.</p>
              </div>
            </div>
          </div>
          <select 
            value={config.data_source} 
            onChange={(e) => onConfigChange({ data_source: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {sources.map(source => (
              <option key={source} value={source}>
                {source === 'Twelve Data' || source === 'Oanda' ? `${source} (Live API)` : source}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Live Engine Controls */}
      <div className="flex flex-col gap-4 bg-indigo-950/20 p-4 rounded-xl border border-indigo-900/30 shadow-inner shadow-indigo-500/5">
        <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
          <Play className="h-3.5 w-3.5" /> Live Prediction Process
        </h3>

        {/* Live Refresh Rate */}
        <div className="flex items-center justify-between">
          <label className="text-xs text-slate-400">Refresh Rate</label>
          <select
            value={config.simulation_speed}
            onChange={(e) => onConfigChange({ simulation_speed: parseFloat(e.target.value) })}
            className="px-2 py-1 text-xs bg-indigo-950/40 border border-indigo-900/50 rounded text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="1">1s</option>
            <option value="2">2s</option>
            <option value="3">3s</option>
            <option value="5">5s</option>
            <option value="10">10s</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          {config.simulation_active ? (
            <button
              onClick={() => onSimulationAction('stop')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
            >
              <Square className="h-3.5 w-3.5" /> Stop Live
            </button>
          ) : (
            <button
              onClick={() => onSimulationAction('start')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer"
            >
              <Play className="h-3.5 w-3.5" /> Start Live
            </button>
          )}

          <button
            onClick={() => onSimulationAction('reset')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-750 transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Model Selection */}
      <div className="flex flex-col gap-4 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 mt-auto">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-2"><Cpu className="h-3.5 w-3.5" /> Prediction Model</span>
          {getStatusBadge()}
        </h3>

        <div className="flex flex-col gap-2">
          {models.map(m => (
            <button
              key={m.name}
              onClick={() => onConfigChange({ selected_model_type: m.name })}
              className={`w-full flex flex-col items-start p-3 text-left border rounded-xl transition-all ${
                config.selected_model_type === m.name 
                  ? 'bg-indigo-500/10 border-indigo-500/50 shadow-md shadow-indigo-500/5' 
                  : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/60'
              }`}
            >
              <span className={`text-sm font-semibold ${config.selected_model_type === m.name ? 'text-indigo-400' : 'text-slate-300'}`}>{m.name} Model</span>
              <span className="text-xs text-slate-500 mt-0.5">{m.desc}</span>
            </button>
          ))}
        </div>

        {/* Model status information / Training */}
        <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800/60 flex flex-col gap-2">
          {trainStatus.status === 'training' ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Training Progress</span>
                <span className="font-semibold text-indigo-400">{trainStatus.progress.epoch ? `Epoch ${trainStatus.progress.epoch}/15` : 'Initializing...'}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                  style={{ width: `${(trainStatus.progress.epoch / 15) * 100}%` }}
                />
              </div>
              {trainStatus.progress.train_loss > 0 && (
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>Train Loss: {trainStatus.progress.train_loss.toFixed(6)}</span>
                  <span>Val Loss: {trainStatus.progress.val_loss.toFixed(6)}</span>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onTrainModel}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-lg shadow-indigo-500/10"
            >
              <RefreshCw className="h-4 w-4" /> Retrain Active Model
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
