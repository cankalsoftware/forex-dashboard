'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData, SeriesMarker, CandlestickSeries, LineSeries } from 'lightweight-charts';

interface LiveChartProps {
  candles: any[]; // Historical candles: {time, open, high, low, close}
  forecast: any[]; // Forecast data: {time, value, upper, lower}
  selectedPair: string;
}

export default function LiveChart({ candles, forecast, selectedPair }: LiveChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const forecastSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const upperCorridorRef = useRef<ISeriesApi<'Line'> | null>(null);
  const lowerCorridorRef = useRef<ISeriesApi<'Line'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 1. Initialize Chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'rgba(15, 23, 42, 0.5)' }, // Slate-900 with transparency
        textColor: '#94a3b8', // Slate-400
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.5)' }, // Slate-800
        horzLines: { color: 'rgba(30, 41, 59, 0.5)' },
      },
      crosshair: {
        mode: 1, // Normal
        vertLine: {
          color: '#6366f1', // Indigo-500
          labelBackgroundColor: '#4f46e5',
        },
        horzLine: {
          color: '#6366f1',
          labelBackgroundColor: '#4f46e5',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(30, 41, 59, 0.8)',
        autoScale: true,
      },
      timeScale: {
        borderColor: 'rgba(30, 41, 59, 0.8)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // 2. Add Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', // Emerald-500
      downColor: '#ef4444', // Red-500
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });
    candleSeriesRef.current = candleSeries;

    // 3. Add Forecast Line Series (Dotted Indigo Line)
    const forecastSeries = chart.addSeries(LineSeries, {
      color: '#6366f1',
      lineWidth: 2,
      lineStyle: 2, // Dotted
      title: 'Forecast',
    });
    forecastSeriesRef.current = forecastSeries;

    // 4. Add Corridor Bounds (Thin dotted lines)
    const upperCorridor = chart.addSeries(LineSeries, {
      color: 'rgba(99, 102, 241, 0.3)',
      lineWidth: 1,
      lineStyle: 3, // Dashed
      title: 'Upper Band',
    });
    upperCorridorRef.current = upperCorridor;

    const lowerCorridor = chart.addSeries(LineSeries, {
      color: 'rgba(99, 102, 241, 0.3)',
      lineWidth: 1,
      lineStyle: 3, // Dashed
      title: 'Lower Band',
    });
    lowerCorridorRef.current = lowerCorridor;

    // 5. Handle Responsive Resizing
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.resize(chartContainerRef.current.clientWidth, 450);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update data when props change
  useEffect(() => {
    if (!candleSeriesRef.current || !forecastSeriesRef.current || !upperCorridorRef.current || !lowerCorridorRef.current || !chartRef.current) return;

    // 1. Set historical candles
    const formattedCandles: CandlestickData[] = candles.map(c => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    
    // Sort just in case timestamps are not in order (TradingView chart requires strict ascending order)
    formattedCandles.sort((a, b) => (a.time as number) - (b.time as number));
    candleSeriesRef.current.setData(formattedCandles);

    // 2. Set forecast path
    if (forecast && forecast.length > 0) {
      // Dotted forecast line starts from the last candle close
      const lastCandle = formattedCandles[formattedCandles.length - 1];
      
      const formattedForecast: LineData[] = [];
      const formattedUpper: LineData[] = [];
      const formattedLower: LineData[] = [];

      if (lastCandle) {
        // Connect history to prediction
        formattedForecast.push({ time: lastCandle.time, value: lastCandle.close });
        formattedUpper.push({ time: lastCandle.time, value: lastCandle.close });
        formattedLower.push({ time: lastCandle.time, value: lastCandle.close });
      }

      forecast.forEach(f => {
        formattedForecast.push({ time: f.time, value: f.value });
        formattedUpper.push({ time: f.time, value: f.upper });
        formattedLower.push({ time: f.time, value: f.lower });
      });

      // Sort forecasts
      const sortByTime = (a: any, b: any) => (a.time as number) - (b.time as number);
      formattedForecast.sort(sortByTime);
      formattedUpper.sort(sortByTime);
      formattedLower.sort(sortByTime);

      forecastSeriesRef.current.setData(formattedForecast);
      upperCorridorRef.current.setData(formattedUpper);
      lowerCorridorRef.current.setData(formattedLower);
      
      // Auto-fit to view the prediction
      chartRef.current.timeScale().fitContent();
    } else {
      forecastSeriesRef.current.setData([]);
      upperCorridorRef.current.setData([]);
      lowerCorridorRef.current.setData([]);
    }
  }, [candles, forecast]);

  return (
    <div className="relative rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-xl glow-subtle">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="flex h-3 h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
          <h2 className="text-lg font-semibold text-slate-100">{selectedPair} Live Chart</h2>
        </div>
        <div className="flex gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1"><span className="h-1.5 w-3 bg-[#10b981] inline-block rounded"></span> Bullish</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-3 bg-[#ef4444] inline-block rounded"></span> Bearish</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-3 bg-[#6366f1] inline-block rounded border border-dashed border-[#6366f1]"></span> Prediction</span>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full h-[450px]" />
    </div>
  );
}
