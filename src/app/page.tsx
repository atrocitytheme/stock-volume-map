'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Stock, 
  Exchange,
  TradeTick,
  DEFAULT_SYMBOLS,
  INITIAL_EXCHANGES,
  isExchangeOpen
} from '../utils/marketDataSim';
import {
  normalizeQuote,
  fetchInitialStocksStaggered,
  normalizeWSTrade,
  FinnhubWSMessage,
  FinnhubWSTradeItem
} from '../utils/finnhubService';
import StockTreemap from '@/components/StockTreemap';
import GlobalVolumeMap from '@/components/GlobalVolumeMap';
import StockDetailsModal from '@/components/StockDetailsModal';
import TradingVolumeLinkCard from '../components/TradingVolumeLinkCard';
import RiskAppetiteChart from '../components/RiskAppetiteChart';
import TacoIndexChart from '../components/TacoIndexChart';
import RealYieldChart from '../components/RealYieldChart';
import IakRecommendationChart from '../components/IakRecommendationChart';
import AdBanner from '../components/AdBanner';
import { Layers, Globe, Info, Sun, Moon } from 'lucide-react';

interface IndexTicker {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export default function Home() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>(INITIAL_EXCHANGES);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  
  // Tab View
  const [activeTab, setActiveTab] = useState<'treemap' | 'geomap'>('treemap');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');

  const getCompactList = () => {
    const categories: Record<string, { totalVol: number, totalReturnVol: number }> = {};
    stocks.forEach(s => {
      const cat = s.category || 'Other';
      if (!categories[cat]) categories[cat] = { totalVol: 0, totalReturnVol: 0 };
      categories[cat].totalVol += s.volume;
      categories[cat].totalReturnVol += s.volume * (s.priceChangePercent / 100);
    });

    return Object.entries(categories)
      .map(([name, data]) => {
        const avgReturn = data.totalVol > 0 ? (data.totalReturnVol / data.totalVol) * 100 : 0;
        return { name, avgReturn, volume: data.totalVol };
      })
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 4);
  };
  


  const [isApiActive, setIsApiActive] = useState<boolean>(false);
  const [loadingQuotes, setLoadingQuotes] = useState<boolean>(true);

  // Version tracking for flash effect
  const dataVersionRef = useRef<number>(0);
  const [isDataFlashing, setIsDataFlashing] = useState<boolean>(false);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  // Market Indices State
  const [indices, setIndices] = useState<IndexTicker[]>([
    { name: 'S&P 500', value: 5088.80, change: 18.20, changePercent: 0.36 },
    { name: 'NASDAQ 100', value: 17985.20, change: 84.50, changePercent: 0.47 },
    { name: 'DOW JONES', value: 39131.50, change: -28.10, changePercent: -0.07 },
    { name: 'FTSE 100', value: 7684.30, change: 12.10, changePercent: 0.16 },
    { name: 'NIKKEI 225', value: 39120.50, change: 240.20, changePercent: 0.62 }
  ]);



  // Poll the backend API proxy for fresh data
  const fetchBackendData = useCallback(async () => {
    try {
      const response = await fetch('/api/market-data');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      if (data.stocks && data.stocks.length > 0) {
        if (data.version !== undefined && data.version > dataVersionRef.current) {
          dataVersionRef.current = data.version;
          setIsDataFlashing(true);
          setTimeout(() => setIsDataFlashing(false), 500);
        }

        setStocks(prevStocks => {
          if (prevStocks.length === 0) {
            // First load, instantly calculate live volume indicator based on price change
            return data.stocks.map((s: Stock) => ({
              ...s,
              volume: Math.floor(s.avgVolume * (Math.max(0.05, Math.abs(s.priceChangePercent)) / 100))
            }));
          }
          // Merge updates, preserving volume since the Finnhub REST API doesn't provide real-time volume
          const updated = data.stocks.map((newStock: Stock) => {
            const oldStock = prevStocks.find(s => s.symbol === newStock.symbol);
            if (oldStock) {
              // Map volume relative to live price change to avoid random simulation accumulation
              const liveVolIndicator = newStock.price !== oldStock.price 
                ? Math.floor(newStock.avgVolume * (Math.max(0.05, Math.abs(newStock.priceChangePercent)) / 100))
                : oldStock.volume;
              return { ...newStock, volume: liveVolIndicator };
            }
            return newStock;
          });

          return updated;
        });

        // Update exchanges mapping live data to volume
        setExchanges(prevExchanges => {
          return prevExchanges.map(ex => {
            const liveDriver = data.stocks.find((s: Stock) => s.symbol === ex.topStockSymbol);
            if (liveDriver) {
              // Set volume statically based on live data magnitude to avoid simulation accumulation
              return {
                ...ex,
                volume: Number((ex.baseVolume * (1 + (Math.abs(liveDriver.priceChangePercent) * 0.5))).toFixed(2))
              };
            }
            return ex;
          });
        });

        // Update indices based on live data
        setIndices(prevIndices => {
          return prevIndices.map(ind => {
            let trackingStock;
            let multiplier = 1;

            if (ind.name === 'S&P 500') {
              trackingStock = data.stocks.find((s: Stock) => s.symbol === 'SPY');
              multiplier = 10; // SPY is ~1/10th of S&P 500
            } else if (ind.name === 'NASDAQ 100') {
              trackingStock = data.stocks.find((s: Stock) => s.symbol === 'QQQ');
              multiplier = 40; // QQQ is ~1/40th of Nasdaq 100
            } else if (ind.name === 'DOW JONES') {
              trackingStock = data.stocks.find((s: Stock) => s.symbol === 'DIA');
              multiplier = 100; // DIA is ~1/100th of Dow Jones
            } else if (ind.name === 'FTSE 100') {
              trackingStock = data.stocks.find((s: Stock) => s.symbol === 'EWU');
              multiplier = 240; // EWU is ~1/240th of FTSE
            } else if (ind.name === 'NIKKEI 225') {
              trackingStock = data.stocks.find((s: Stock) => s.symbol === 'EWJ');
              multiplier = 650; // EWJ is ~1/650th of Nikkei
            }

            if (trackingStock) {
              return {
                ...ind,
                value: Number((trackingStock.price * multiplier).toFixed(2)),
                change: Number((trackingStock.priceChange * multiplier).toFixed(2)),
                changePercent: trackingStock.priceChangePercent
              };
            }

            return ind; // Fallback if data is still fetching
          });
        });

        setLoadingQuotes(false);
        setIsApiActive(true);
      } else if (data.isFetching) {
        // Backend is still fetching the initial batch, retry soon
        setLoadingQuotes(true);
        setTimeout(fetchBackendData, 2000);
      }
    } catch (err) {
      console.error('Failed to fetch from backend proxy:', err);
      // Fallback gracefully instead of hanging
      setLoadingQuotes(false);
      setIsApiActive(false);
    }
  }, []);

  // Poll backend every 5 seconds
  useEffect(() => {
    fetchBackendData();
    const interval = setInterval(fetchBackendData, 5000);
    return () => clearInterval(interval);
  }, [fetchBackendData]);



  const stocksUp = stocks.filter(s => s.priceChangePercent > 0).length;
  const stocksDown = stocks.filter(s => s.priceChangePercent < 0).length;
  const totalTradedVolShares = stocks.reduce((sum, s) => sum + s.volume, 0);
  const activeExchangesCount = exchanges.filter(ex => isExchangeOpen(ex)).length;

  return (
    <div className="mobile-page-root" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      

      {/* Top Header Navigation */}
      <header 
        className="glass-panel mobile-header" 
        style={{ 
          height: '60px', 
          margin: '10px 10px 0 10px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0 20px', 
          background: 'var(--bg-surface-glass)' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-volume) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '15px', color: 'var(--color-bg-deep)', boxShadow: '0 0 12px var(--color-accent-glow)' }}>
            A
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              MACRO INDEXES <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>|</span> TRACKER
            </h1>
            <h2 style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, margin: 0 }}>REAL-TIME MARKET MACRO & RISK APPETITE</h2>
          </div>
        </div>

        {/* Loading indicator for backend proxy */}
        {loadingQuotes && (
          <div style={{ flex: 1, maxWidth: '280px', margin: '0 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 700, color: 'var(--color-volume)' }}>
              <span>SYNCING SECURE MARKET PROXY...</span>
            </div>
            <div style={{ height: '4px', width: '100%', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
              <div 
                style={{ 
                  width: '50%', 
                  height: '100%', 
                  background: 'var(--color-volume)',
                  position: 'absolute',
                  animation: 'indeterminate-slide 1.5s infinite ease-in-out'
                }}
              ></div>
            </div>
          </div>
        )}

        {/* View Selection Navigation Tabs */}
        {!loadingQuotes && (
          <div className="mobile-tabs" style={{ display: 'flex', background: 'var(--bg-panel)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveTab('treemap')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: activeTab === 'treemap' ? 'var(--color-accent)' : 'transparent',
                border: 'none',
                color: activeTab === 'treemap' ? 'var(--color-bg-deep)' : 'var(--text-primary)',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
                transition: 'all var(--transition-fast)'
              }}
            >
              <Layers size={13} />
              Market Heatmap
            </button>
            <button
              onClick={() => setActiveTab('geomap')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: activeTab === 'geomap' ? 'var(--color-accent)' : 'transparent',
                border: 'none',
                color: activeTab === 'geomap' ? 'var(--color-bg-deep)' : 'var(--text-primary)',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
                transition: 'all var(--transition-fast)'
              }}
            >
              <Globe size={13} />
              Global Exchanges
            </button>
          </div>
        )}

        {/* Controls Panel */}
        <div className="mobile-controls" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Active status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-panel)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '10px' }}>
            <span 
              style={{ 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--color-gain-bright)', 
                display: 'inline-block', 
                boxShadow: '0 0 6px var(--color-gain-bright)' 
              }}
            ></span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '9px' }}>
              LIVE MARKET (PROXY)
            </span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--glass-shadow)'
            }}
            title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>


        </div>
      </header>

      {/* Market Indices Ticker Belt */}
      <div 
        className="glass-panel mobile-wrap"
        style={{ 
          height: '36px', 
          margin: '8px 10px 0 10px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '24px', 
          padding: '0 16px', 
          overflowX: 'auto',
          background: 'var(--bg-surface-glass)',
          borderStyle: 'dashed'
        }}
      >
        {indices.map((idx, index) => {
          const isUp = idx.changePercent >= 0;
          return (
            <div key={`index-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>{idx.name}</span>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{idx.value.toLocaleString()}</span>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '10px', color: isUp ? 'var(--color-gain-bright)' : 'var(--color-loss-bright)' }}>
                {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{Number(idx.changePercent).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Split Grid */}
      <main style={{ padding: '10px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="desktop-grid">
          {/* LEFT PANE */}
          <div className="desktop-left-pane">
            
            {/* Mobile Toggle */}
            <div className="mode-toggle-container">
              <div className="mode-toggle">
                <button className={viewMode === 'compact' ? 'active' : ''} onClick={() => setViewMode('compact')}>
                  <Info size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-top' }}/> Compact Mode
                </button>
                <button className={viewMode === 'detailed' ? 'active' : ''} onClick={() => setViewMode('detailed')}>
                  Detailed Mode <Info size={12} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'text-top' }}/>
                </button>
              </div>
            </div>

            {/* Map / Compact List */}
            <div className="map-view-container" style={{ flex: 1, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
              
              {/* COMPACT VIEW (Hidden on desktop via CSS) */}
              <div className={`view-compact ${viewMode === 'compact' ? 'active' : ''}`}>
                <div className="compact-list" style={{ marginBottom: '16px' }}>
                  {getCompactList().map((item, idx) => (
                    <div key={idx} className="compact-list-item" style={{ background: item.avgReturn >= 0 ? 'var(--color-gain-dark)' : 'var(--color-loss-dark)' }}>
                      <span>{idx + 1} {item.name} ({item.avgReturn >= 0 ? '+' : ''}{item.avgReturn.toFixed(2)}%) | Vol: {(item.volume/1000).toFixed(1)}K</span>
                      <span>{item.avgReturn >= 0 ? '▲' : '▼'}</span>
                    </div>
                  ))}
                </div>
                {/* Mobile In-Feed Ad Placed Below Compact List */}
                <AdBanner format="rectangle" />
              </div>

              {/* DETAILED VIEW (Always visible on desktop via CSS) */}
              <div className={`view-detailed ${viewMode === 'detailed' ? 'active' : ''}`}>
                <div className="mobile-map-container" style={{ flex: 1, minHeight: '400px', marginBottom: '16px' }}>
                  {activeTab === 'treemap' ? (
                    <StockTreemap stocks={stocks} onSelectStock={setSelectedStock} isDataFlashing={isDataFlashing} />
                  ) : (
                    <GlobalVolumeMap exchanges={exchanges} stocks={stocks} />
                  )}
                </div>
                {/* Desktop Ad Below Treemap (Also visible on mobile detailed mode) */}
                <AdBanner format="horizontal" />
              </div>

            </div>
          </div>

          {/* RIGHT PANE */}
          <div className="desktop-right-pane">
            <TradingVolumeLinkCard isDataFlashing={isDataFlashing} />
            <RiskAppetiteChart />
            <div className="desktop-only-ad" style={{ marginTop: 'auto' }}>
              <AdBanner format="rectangle" />
            </div>
          </div>
        </div>

        {/* SECONDARY GRID for other charts */}
        <div className="desktop-secondary-grid">
          <TacoIndexChart />
          <RealYieldChart />
          <IakRecommendationChart />
        </div>

        {/* Footer Controls Dashboard */}
        <div className="glass-panel mobile-footer" style={{ marginTop: '16px', padding: '10px 16px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', background: 'var(--bg-surface-glass)' }}>
          {/* Quick Stats */}
          <div className="mobile-stats-row" style={{ display: 'flex', gap: '24px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <div>
              Traded Shares: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{totalTradedVolShares.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              Breadth: 
              <span style={{ color: 'var(--color-gain-bright)', fontWeight: 700 }}>{stocksUp} ▲</span>
              <span style={{ color: 'var(--color-loss-bright)', fontWeight: 700 }}>{stocksDown} ▼</span>
            </div>
            <div>
              Active Markets: <strong style={{ color: 'var(--text-primary)' }}>{activeExchangesCount} / {exchanges.length}</strong>
            </div>
          </div>
        </div>
      </main>

      {/* Stock detail Modal Overlay */}
      {selectedStock && (
        <StockDetailsModal 
          key={selectedStock.symbol} /* Force unmount/remount on selection changes to clear internal state */
          stock={selectedStock} 
          onClose={() => setSelectedStock(null)} 
        />
      )}

      {/* Sticky Bottom Anchor Ad for Mobile */}
      <div className="sticky-bottom-ad">
        <AdBanner format="anchor" />
      </div>


    </div>
  );
}
