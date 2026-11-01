'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Play, CheckCircle2, ChevronRight, X } from 'lucide-react';

interface MarketNoticeBannerProps {
  simulationActive: boolean;
  onStartSimulation: () => void;
}

export default function MarketNoticeBanner({ simulationActive, onStartSimulation }: MarketNoticeBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [targetOpenTime, setTargetOpenTime] = useState<string>('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const day = now.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
      const hour = now.getUTCHours();
      const minute = now.getUTCMinutes();
      const second = now.getUTCSeconds();

      // Interbank FX is closed from Friday 22:00 UTC to Sunday 22:00 UTC
      let marketOpen = true;
      let secondsToOpen = 0;

      if (day === 6) { // Saturday
        marketOpen = false;
        // Remaining Saturday hours (24 - hour) + Sunday hours until 22:00 (22 hours)
        secondsToOpen = ((24 - hour - 1) + 22) * 3600 + (60 - minute - 1) * 60 + (60 - second);
      } else if (day === 0 && hour < 22) { // Sunday before 22:00 UTC
        marketOpen = false;
        secondsToOpen = (22 - hour - 1) * 3600 + (60 - minute - 1) * 60 + (60 - second);
      } else if (day === 5 && hour >= 22) { // Friday after 22:00 UTC
        marketOpen = false;
        // Friday remaining (24 - hour) + Sat (24) + Sun (22)
        secondsToOpen = ((24 - hour - 1) + 24 + 22) * 3600 + (60 - minute - 1) * 60 + (60 - second);
      }

      setIsOpen(marketOpen);

      if (!marketOpen && secondsToOpen > 0) {
        const h = Math.floor(secondsToOpen / 3600);
        const m = Math.floor((secondsToOpen % 3600) / 60);
        const s = secondsToOpen % 60;
        setTimeRemaining(`${h}h ${m}m ${s}s`);
        setTargetOpenTime('Sunday 22:00 UTC (Sydney / Tokyo Open)');
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // If market is open or dismissed, don't show the full banner
  if (isOpen || (dismissed && !simulationActive)) return null;

  return (
    <aside aria-label="Market Status Notice" className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-amber-950/30 p-4 sm:p-5 backdrop-blur-xl shadow-lg shadow-amber-500/5 glow-subtle">
      {/* Background ambient glow */}
      <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
        {/* Left side: Icon + Message */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-md shadow-amber-500/10 flex-shrink-0 mt-0.5">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
          </div>

          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-black tracking-wider uppercase flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                Interbank Forex Market Is Closed
              </span>

              {timeRemaining && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-950/80 text-amber-300 border border-amber-500/30 text-[11px] font-mono font-bold flex items-center gap-1">
                  <Clock className="h-3 w-3 text-amber-400" />
                  Opens in {timeRemaining}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-200 font-semibold mt-1.5">
              Live exchange rate feeds are paused until the Sydney interbank session opens ({targetOpenTime}).
            </p>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Because financial exchanges are closed for the weekend, prices will not tick automatically. Use <strong>Simulation Mode</strong> to replay historical candles and watch the AI prediction engine generate live forecasts.
            </p>
          </div>
        </div>

        {/* Right side: Action Button */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t border-slate-800/80 lg:border-none">
          {!simulationActive ? (
            <button
              onClick={onStartSimulation}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer transform hover:scale-[1.02]"
            >
              <Play className="h-4 w-4 fill-slate-950" />
              <span>Launch Live Simulation Replay</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
              <span>Simulation Replay Active</span>
            </div>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
            title="Minimize alert"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

