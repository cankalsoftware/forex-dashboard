'use client';

import React, { useEffect, useState } from 'react';
import { Globe, Clock, AlertCircle, Play, CheckCircle2, Moon, Sun } from 'lucide-react';

interface MarketSessionsProps {
  onStartSimulation?: () => void;
  simulationActive?: boolean;
}

export default function MarketSessions({ onStartSimulation, simulationActive }: MarketSessionsProps) {
  const [utcTime, setUtcTime] = useState<string>('');
  const [localTime, setLocalTime] = useState<string>('');
  const [marketStatus, setMarketStatus] = useState({
    isOpen: false,
    activeSessions: [] as string[],
    overlap: null as string | null,
    sessions: {
      sydney: { name: 'Sydney', open: false, hours: '22:00 - 07:00 UTC' },
      tokyo: { name: 'Tokyo', open: false, hours: '00:00 - 09:00 UTC' },
      london: { name: 'London', open: false, hours: '08:00 - 17:00 UTC' },
      newYork: { name: 'New York', open: false, hours: '13:00 - 22:00 UTC' }
    }
  });

  useEffect(() => {
    const updateSessions = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC').split(' ').slice(0, 5).join(' '));
      setLocalTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      const day = now.getUTCDay(); // 0 = Sunday, ..., 6 = Saturday
      const hour = now.getUTCHours();

      // Market is closed from Friday 22:00 UTC to Sunday 22:00 UTC
      let isOpen = true;
      if (day === 6) { // Saturday
        isOpen = false;
      } else if (day === 0 && hour < 22) { // Sunday before 22:00 UTC
        isOpen = false;
      } else if (day === 5 && hour >= 22) { // Friday after 22:00 UTC
        isOpen = false;
      }

      // Check sessions
      const sydneyOpen = isOpen && (hour >= 22 || hour < 7);
      const tokyoOpen = isOpen && (hour >= 0 && hour < 9);
      const londonOpen = isOpen && (hour >= 8 && hour < 17);
      const newYorkOpen = isOpen && (hour >= 13 && hour < 22);

      const active: string[] = [];
      if (sydneyOpen) active.push('Sydney');
      if (tokyoOpen) active.push('Tokyo');
      if (londonOpen) active.push('London');
      if (newYorkOpen) active.push('New York');

      let overlap: string | null = null;
      if (londonOpen && newYorkOpen) {
        overlap = 'London - New York Overlap (Peak Volatility)';
      } else if (tokyoOpen && londonOpen) {
        overlap = 'Tokyo - London Overlap';
      } else if (sydneyOpen && tokyoOpen) {
        overlap = 'Sydney - Tokyo Overlap';
      }

      setMarketStatus({
        isOpen,
        activeSessions: active,
        overlap,
        sessions: {
          sydney: { name: 'Sydney', open: sydneyOpen, hours: '22:00 - 07:00 UTC' },
          tokyo: { name: 'Tokyo', open: tokyoOpen, hours: '00:00 - 09:00 UTC' },
          london: { name: 'London', open: londonOpen, hours: '08:00 - 17:00 UTC' },
          newYork: { name: 'New York', open: newYorkOpen, hours: '13:00 - 22:00 UTC' }
        }
      });
    };

    updateSessions();
    const interval = setInterval(updateSessions, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* Session clocks & Live Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-2.5 backdrop-blur-md text-xs">
        {/* Left: Market Status badge + Overlap info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`relative flex h-2.5 w-2.5`}>
              {marketStatus.isOpen ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              )}
            </span>
            <span className={`font-bold uppercase tracking-wider text-[11px] ${marketStatus.isOpen ? 'text-emerald-400' : 'text-amber-400'}`}>
              {marketStatus.isOpen ? 'Interbank Market Open' : 'Market Closed (Weekend)'}
            </span>
          </div>

          {marketStatus.overlap && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-medium">
              🔥 {marketStatus.overlap}
            </span>
          )}
        </div>

        {/* Center: Global Trading Hubs */}
        <div className="flex items-center gap-2">
          {Object.entries(marketStatus.sessions).map(([key, sess]) => (
            <div
              key={key}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-all border ${
                sess.open
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-semibold shadow-sm shadow-emerald-500/10'
                  : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
              }`}
              title={`${sess.name}: ${sess.hours}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${sess.open ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span>{sess.name}</span>
            </div>
          ))}
        </div>

        {/* Right: Real-time clocks */}
        <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-slate-500" />
            <span className="text-slate-300">{utcTime || 'UTC'}</span>
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-slate-500">Local: {localTime}</span>
        </div>
      </div>

      {/* Weekend Notice / Simulation Banner when market is closed */}
      {!marketStatus.isOpen && !simulationActive && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-slate-900/60 to-indigo-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs backdrop-blur-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200">
                Global Interbank FX is closed for the weekend (Friday 22:00 UTC – Sunday 22:00 UTC).
              </p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Live prices do not tick on weekends. Launch <strong>Simulation Mode</strong> to replay historical candles and watch the AI prediction engine generate live forecasts.
              </p>
            </div>
          </div>

          {onStartSimulation && (
            <button
              onClick={onStartSimulation}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all flex-shrink-0 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Launch Simulation Replay
            </button>
          )}
        </div>
      )}
    </div>
  );
}

