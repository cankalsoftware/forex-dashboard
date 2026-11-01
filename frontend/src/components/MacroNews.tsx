'use client';

import React, { useState, useEffect } from 'react';
import { 
  Newspaper, 
  Flame, 
  Landmark, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  Filter, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  time_ago: string;
  category: string;
  impact: 'High' | 'Medium' | 'Low';
  sentiment: string;
  affected_currencies: string[];
  transmission: string;
}

interface CentralBankRate {
  bank: string;
  currency: string;
  rate: string;
  next_meeting: string;
  bias: string;
  color: string;
}

interface MacroNewsProps {
  selectedPair: string;
  backendUrl?: string;
}

export default function MacroNews({ selectedPair, backendUrl = 'http://localhost:8000' }: MacroNewsProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [rates, setRates] = useState<CentralBankRate[]>([]);
  const [sentimentIndex, setSentimentIndex] = useState({
    usd_strength: 64,
    macro_bias: 'USD Leaning Bullish vs High-Beta Peers',
    key_driver: 'Interest Rate Divergence & US Economic Exceptionalism'
  });
  const [loading, setLoading] = useState(true);
  const [selectedCurrencyFilter, setSelectedCurrencyFilter] = useState<string>('ALL');
  const [selectedImpactFilter, setSelectedImpactFilter] = useState<string>('ALL');
  const [expandedTransmission, setExpandedTransmission] = useState<Record<string, boolean>>({});

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/api/news?pair=${selectedPair}`);
      if (res.ok) {
        const data = await res.json();
        setNews(data.news || []);
        setRates(data.central_bank_rates || []);
        if (data.sentiment_index) setSentimentIndex(data.sentiment_index);
      }
    } catch (e) {
      console.error('Failed to fetch news from backend, using default economist feed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [selectedPair]);

  const toggleTransmission = (id: string) => {
    setExpandedTransmission(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Currencies extracted from selected pair
  const pairCurrencies = selectedPair.replace('/', ' ').split(' ').filter(Boolean);

  const filteredNews = news.filter(item => {
    if (selectedCurrencyFilter === 'CURRENT') {
      return item.affected_currencies.some(c => pairCurrencies.includes(c));
    }
    if (selectedCurrencyFilter !== 'ALL') {
      return item.affected_currencies.includes(selectedCurrencyFilter);
    }
    return true;
  }).filter(item => {
    if (selectedImpactFilter === 'HIGH') return item.impact === 'High';
    if (selectedImpactFilter === 'CB') return item.category.toLowerCase().includes('central bank') || item.category.toLowerCase().includes('policy');
    return true;
  });

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-xl glow-subtle">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/70">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">
            <Newspaper className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">Global Macro & FX News Wire</h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-semibold uppercase tracking-wider">
                Bloomberg / Reuters Wire
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live fundamental catalysts, monetary policy divergence, and macroeconomic transmission mechanisms.
            </p>
          </div>
        </div>

        {/* Currency & Impact Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex bg-slate-950/60 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setSelectedCurrencyFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                selectedCurrencyFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All FX
            </button>
            <button
              onClick={() => setSelectedCurrencyFilter('CURRENT')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                selectedCurrencyFilter === 'CURRENT' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {selectedPair} Only
            </button>
            <button
              onClick={() => setSelectedCurrencyFilter('USD')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                selectedCurrencyFilter === 'USD' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              USD
            </button>
            <button
              onClick={() => setSelectedCurrencyFilter('EUR')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                selectedCurrencyFilter === 'EUR' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EUR
            </button>
            <button
              onClick={() => setSelectedCurrencyFilter('GBP')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                selectedCurrencyFilter === 'GBP' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              GBP
            </button>
          </div>

          <button
            onClick={() => setSelectedImpactFilter(prev => prev === 'HIGH' ? 'ALL' : 'HIGH')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
              selectedImpactFilter === 'HIGH'
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-rose-400" />
            High Impact
          </button>

          <button
            onClick={fetchNews}
            className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh News Feed"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Macro Fundamental Summary: Central Bank Rates & Global Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Central Bank Policy Matrix */}
        <div className="lg:col-span-2 bg-slate-950/50 rounded-xl border border-slate-800/80 p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Landmark className="h-3.5 w-3.5 text-indigo-400" />
              Central Bank Policy Rate Matrix
            </span>
            <span className="text-[10px] text-slate-500">Key Driver of Long-Term FX Trends</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {(rates.length > 0 ? rates : [
              { bank: 'Federal Reserve', currency: 'USD', rate: '5.25 - 5.50%', bias: 'Hawkish Pause', color: 'text-indigo-400' },
              { bank: 'Bank of England', currency: 'GBP', rate: '5.00%', bias: 'Cautious Hold', color: 'text-sky-400' },
              { bank: 'European Central Bank', currency: 'EUR', rate: '3.50%', bias: 'Dovish Cut', color: 'text-emerald-400' },
              { bank: 'Bank of Japan', currency: 'JPY', rate: '0.25%', bias: 'Hawkish Tilt', color: 'text-rose-400' },
              { bank: 'Reserve Bank of Australia', currency: 'AUD', rate: '4.35%', bias: 'Restrictive Hold', color: 'text-amber-400' }
            ]).map((cb, idx) => (
              <div key={idx} className="bg-slate-900/60 rounded-lg p-2 border border-slate-800/60 flex flex-col">
                <span className="text-[10px] text-slate-400 font-semibold truncate">{cb.bank}</span>
                <span className={`text-sm font-black mt-0.5 ${cb.color}`}>{cb.rate}</span>
                <span className="text-[9px] text-slate-400 mt-1 truncate">{cb.bias}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Macro Sentiment Gauge */}
        <div className="bg-slate-950/50 rounded-xl border border-slate-800/80 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Global Macro Bias
            </span>
            <span className="text-[10px] text-indigo-400 font-mono">DXY Bias: {sentimentIndex.usd_strength}%</span>
          </div>

          <div className="my-2">
            <p className="text-xs font-bold text-slate-200">{sentimentIndex.macro_bias}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{sentimentIndex.key_driver}</p>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-emerald-500 via-indigo-500 to-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${sentimentIndex.usd_strength}%` }}
            />
          </div>
        </div>
      </div>

      {/* News Feed Stream */}
      <div className="flex flex-col gap-3">
        {filteredNews.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No macroeconomic news matching the current filter. Select "All FX" to view full global wire.
          </div>
        ) : (
          filteredNews.map(item => {
            const isExpanded = !!expandedTransmission[item.id];
            const isHighImpact = item.impact === 'High';
            
            return (
              <div 
                key={item.id}
                className="bg-slate-950/40 rounded-xl border border-slate-800/80 p-4 hover:border-slate-700/80 transition-all flex flex-col gap-2.5"
              >
                {/* Meta line */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300 text-[11px]">{item.source}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-500 text-[11px]">{item.time_ago}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 font-medium">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Impact badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isHighImpact 
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {isHighImpact && <Flame className="h-2.5 w-2.5" />}
                      {item.impact} Impact
                    </span>

                    {/* Sentiment */}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      item.sentiment.includes('Bullish') 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : item.sentiment.includes('Bearish')
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.sentiment}
                    </span>

                    {/* Currencies */}
                    <div className="flex gap-1">
                      {item.affected_currencies.map(curr => (
                        <span key={curr} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[9px] font-mono font-bold">
                          {curr}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Title & Summary */}
                <div>
                  <h3 className="text-sm font-bold text-slate-100 hover:text-indigo-300 transition-colors cursor-pointer">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                {/* Economist Transmission Mechanism Dropdown */}
                <div className="pt-1">
                  <button
                    onClick={() => toggleTransmission(item.id)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    <Info className="h-3.5 w-3.5" />
                    <span>How this affects Forex (Transmission Mechanism)</span>
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/30 text-xs text-indigo-200 leading-relaxed flex gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5" />
                      <div>
                        <strong className="text-indigo-300 font-semibold">Economist Analysis: </strong>
                        <span>{item.transmission}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

