import React from 'react';
import { TrendingUp, TrendingDown, Gauge, ShieldCheck, Activity, Briefcase } from 'lucide-react';

interface StatsCardProps {
  prediction: {
    direction: string;
    probability_up: number;
    current_price: number;
  };
  metrics: {
    regression_r2?: number;
    classifier_accuracy?: number;
    final_val_loss?: number;
  };
  latestCandle: {
    rsi?: number;
    atr?: number;
  };
  selectedPair: string;
}

export default function StatsCard({ prediction, metrics, latestCandle, selectedPair }: StatsCardProps) {
  const isUp = prediction.direction === 'UP';
  const probPercentage = Math.round(
    isUp ? prediction.probability_up * 100 : (1 - prediction.probability_up) * 100
  );

  const formatPrice = (val: number) => {
    if (!val) return '---';
    // JPY pairs use 3 decimals, others use 5 decimals
    const isJpy = selectedPair.includes('JPY');
    return val.toFixed(isJpy ? 3 : 5);
  };

  const getRsiStatus = (rsi?: number) => {
    if (rsi === undefined) return { text: '---', color: 'text-slate-400' };
    if (rsi >= 70) return { text: 'Overbought', color: 'text-rose-400 font-semibold animate-pulse' };
    if (rsi <= 30) return { text: 'Oversold', color: 'text-emerald-400 font-semibold animate-pulse' };
    return { text: 'Neutral', color: 'text-slate-400' };
  };

  const rsiInfo = getRsiStatus(latestCandle?.rsi);

  const getBrokerAdvice = () => {
    let advice = "";
    if (prediction.probability_up > 0.65) {
      advice = "Strong Bullish momentum detected. The predictive engine suggests a high probability of an upward breakout. Consider scaling into a LONG position, placing a stop-loss just below the recent swing low to protect capital.";
    } else if (prediction.probability_up > 0.55) {
      advice = "Slight Bullish bias. The market is leaning upwards, but conviction is moderate. If entering LONG, consider reducing position size and wait for confirmation of support.";
    } else if (prediction.probability_up < 0.35) {
      advice = "Strong Bearish momentum detected. The predictive engine projects significant downside. Consider a SHORT position, utilizing the recent highest high as a strict stop-loss level.";
    } else if (prediction.probability_up < 0.45) {
      advice = "Slight Bearish bias. Downward pressure is building, but the trend isn't fully established. Exercise caution and look for resistance bounces if taking SHORT positions.";
    } else {
      advice = "Market is in a neutral consolidation phase. The AI detects conflicting signals. Best professional practice is to stay flat and wait for a clear directional breakout before committing capital.";
    }
    
    if (latestCandle?.rsi) {
      if (latestCandle.rsi > 70) advice += " Warning: RSI indicates the asset is currently OVERBOUGHT; watch for potential exhaustion or pullbacks before entering.";
      if (latestCandle.rsi < 30) advice += " Note: RSI indicates the asset is currently OVERSOLD; be alert for potential bounce or reversal opportunities.";
    }
    
    return advice;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Directional Prediction Widget */}
      <div className={`rounded-2xl border p-5 backdrop-blur-xl transition-all duration-500 flex flex-col justify-between h-40 ${
        isUp 
          ? 'bg-emerald-950/10 border-emerald-900/50 glow-emerald' 
          : 'bg-rose-950/10 border-rose-900/50 glow-rose'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Next Move Forecast</span>
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
            isUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
          }`}>
            Probability: {probPercentage}%
          </span>
        </div>

        <div className="flex items-center gap-3 my-2">
          {isUp ? (
            <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <TrendingUp className="h-7 w-7" />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
              <TrendingDown className="h-7 w-7" />
            </div>
          )}
          <div>
            <h4 className={`text-2xl font-black ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isUp ? 'BULLISH' : 'BEARISH'}
            </h4>
            <p className="text-xs text-slate-400 font-medium">Predicted direction of the next bar</p>
          </div>
        </div>

        <div className="flex justify-between text-xs border-t border-slate-800/40 pt-2 text-slate-500 font-mono">
          <span>Target Close: {formatPrice(prediction.current_price)}</span>
          <span className="font-semibold text-slate-300">Ticks Streaming...</span>
        </div>
      </div>

      {/* 2. Technical Snapshot Widget */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 p-5 backdrop-blur-xl h-40 flex flex-col justify-between glow-subtle">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 tracking-wider uppercase">
          <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-indigo-400" /> Technical Snapshot</span>
        </div>

        <div className="grid grid-cols-2 gap-4 my-auto">
          {/* RSI */}
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-bold">RSI (14)</span>
            <span className="text-lg font-bold text-slate-200 mt-0.5">
              {latestCandle?.rsi ? latestCandle.rsi.toFixed(2) : '---'}
            </span>
            <span className={`text-[10px] mt-0.5 ${rsiInfo.color}`}>{rsiInfo.text}</span>
          </div>

          {/* Volatility ATR */}
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-bold">ATR Volatility</span>
            <span className="text-lg font-bold text-slate-200 mt-0.5 font-mono">
              {latestCandle?.atr ? latestCandle.atr.toFixed(5) : '---'}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">Expected pip spread</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 border-t border-slate-800/40 pt-2">
          Dynamic metrics updated every tick
        </div>
      </div>

      {/* 3. Model Accuracy / Backtest Metrics */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 p-5 backdrop-blur-xl h-40 flex flex-col justify-between glow-subtle">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 tracking-wider uppercase">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-indigo-400" /> Model Performance</span>
        </div>

        <div className="grid grid-cols-2 gap-4 my-auto">
          {/* R2 or Val Loss */}
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-bold">
              {metrics.final_val_loss !== undefined ? 'LSTM Val Loss' : 'Regression R2'}
            </span>
            <span className="text-lg font-bold text-slate-200 mt-0.5 font-mono">
              {metrics.final_val_loss !== undefined 
                ? metrics.final_val_loss.toFixed(6) 
                : (metrics.regression_r2 !== undefined ? metrics.regression_r2.toFixed(4) : '---')}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">Predictive error limit</span>
          </div>

          {/* Hit Ratio / Classification Accuracy */}
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Directional Accuracy</span>
            <span className="text-lg font-bold text-slate-200 mt-0.5 font-mono">
              {metrics.classifier_accuracy !== undefined 
                ? `${(metrics.classifier_accuracy * 100).toFixed(1)}%` 
                : '---'}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">Hit ratio on test set</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 border-t border-slate-800/40 pt-2">
          Train results based on historical window
        </div>
      </div>
      </div>

      {/* 4. Broker's Desk Expert Guidance */}
      <div className="rounded-2xl border border-indigo-900/50 bg-gradient-to-r from-indigo-950/40 to-slate-900/40 p-5 backdrop-blur-xl glow-subtle">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400">
            <Briefcase className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Broker's Desk Analysis</h3>
          <span className="ml-auto text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">Expert Guidance</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed border-l-2 border-indigo-500 pl-4">
          {getBrokerAdvice()}
        </p>
      </div>
    </div>
  );
}
