'use client';

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface MacroTickerProps {
  selectedPair: string;
  onSelectPair: (pair: string) => void;
  latestPrice?: number;
}

export default function MacroTicker({ selectedPair, onSelectPair, latestPrice }: MacroTickerProps) {
  const pairs = [
    { symbol: 'GBP/USD', name: 'Cable', rate: selectedPair === 'GBP/USD' && latestPrice ? latestPrice.toFixed(5) : '1.27420', change: '+0.18%', up: true },
    { symbol: 'EUR/USD', name: 'Euro', rate: selectedPair === 'EUR/USD' && latestPrice ? latestPrice.toFixed(5) : '1.08350', change: '-0.12%', up: false },
    { symbol: 'USD/JPY', name: 'Yen', rate: selectedPair === 'USD/JPY' && latestPrice ? latestPrice.toFixed(3) : '155.450', change: '+0.34%', up: true },
    { symbol: 'AUD/USD', name: 'Aussie', rate: selectedPair === 'AUD/USD' && latestPrice ? latestPrice.toFixed(5) : '0.65820', change: '-0.05%', up: false },
    { symbol: 'USD/CHF', name: 'Swissie', rate: '0.90150', change: '+0.08%', up: true },
    { symbol: 'DXY Index', name: 'US Dollar Index', rate: '104.85', change: '+0.21%', up: true }
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 pl-1 pr-2 flex-shrink-0">
        <DollarSign className="h-3 w-3 text-indigo-400" />
        Major Pairs:
      </span>

      {pairs.map(p => {
        const isSelected = selectedPair === p.symbol;
        const isClickable = ['GBP/USD', 'EUR/USD', 'USD/JPY', 'AUD/USD'].includes(p.symbol);

        return (
          <button
            key={p.symbol}
            disabled={!isClickable}
            onClick={() => isClickable && onSelectPair(p.symbol)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-left transition-all flex-shrink-0 ${
              isSelected
                ? 'bg-indigo-600/20 border-indigo-500/60 text-white shadow-sm shadow-indigo-500/20 ring-1 ring-indigo-500/30'
                : isClickable
                ? 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900 cursor-pointer'
                : 'bg-slate-950/30 border-slate-800/40 text-slate-500 cursor-default opacity-80'
            }`}
          >
            <div className="flex flex-col">
              <span className={`font-bold text-[11px] ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>
                {p.symbol}
              </span>
              <span className="text-[9px] text-slate-500">{p.name}</span>
            </div>

            <div className="flex flex-col items-end font-mono">
              <span className="text-[11px] font-semibold text-slate-200">{p.rate}</span>
              <span className={`text-[9px] flex items-center gap-0.5 font-bold ${
                p.up ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {p.up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {p.change}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

