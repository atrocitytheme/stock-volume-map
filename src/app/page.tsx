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
import MarketLeverageChart from '../components/MarketLeverageChart';
import CapeIndexChart from '../components/CapeIndexChart';
import BusinessInvestmentChart from '../components/BusinessInvestmentChart';
import AdBanner from '../components/AdBanner';
import { Layers, Globe, Info, Sun, Moon } from 'lucide-react';
import Script from 'next/script';

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
      const cat = s.sector || 'Other';
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
      <Script 
        id="adsbygoogle-init"
        strategy="afterInteractive"
        crossOrigin="anonymous"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3962513051446394"
      />

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
                {/* Mobile In-Feed Ad Placed Below Compact List — only render after content loads */}
                {!loadingQuotes && <AdBanner format="rectangle" />}
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
                {/* Desktop Ad Below Treemap — only render after content loads */}
                {!loadingQuotes && <AdBanner format="horizontal" />}
              </div>

            </div>
          </div>

          {/* RIGHT PANE */}
          <div className="desktop-right-pane">
            <TradingVolumeLinkCard isDataFlashing={isDataFlashing} />
            <RiskAppetiteChart />
          </div>
        </div>

        {/* SECONDARY GRID for other charts */}
        <div className="desktop-secondary-grid">
          <TacoIndexChart />
          <RealYieldChart />
          <MarketLeverageChart />
          <IakRecommendationChart />
          <CapeIndexChart />
          <BusinessInvestmentChart />
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

        {/* === EDUCATIONAL CONTENT SECTIONS === */}
        {/* These sections provide substantial crawlable text for Google's AdSense and search crawlers */}

        {/* Section: Understanding the Dashboard */}
        <section style={{ marginTop: '32px', padding: '32px 24px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', letterSpacing: '-0.5px' }}>
            Understanding the AeroTrade Macro Dashboard
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            AeroTrade provides a real-time overview of global financial markets through a suite of institutional-grade macro indicators. The dashboard tracks major market indexes including the S&amp;P 500, NASDAQ 100, Dow Jones Industrial Average, FTSE 100, and Nikkei 225, alongside proprietary composite indicators that measure market sentiment, risk appetite, credit conditions, and valuation metrics.
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            The interactive treemap heatmap displays individual stock performance weighted by trading volume, allowing you to quickly identify which sectors and securities are driving market movements. Green tiles indicate positive price changes while red tiles indicate declines, with the size of each tile reflecting relative trading volume. Click any tile to view detailed stock information including price history, volume trends, and key financial metrics.
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            The Global Exchanges view maps trading activity across major stock exchanges worldwide, including the NYSE, NASDAQ, London Stock Exchange, Tokyo Stock Exchange, Hong Kong Exchange, and more. Exchange markers pulse in real time to indicate active trading sessions, providing an at-a-glance view of which global markets are currently open and their relative trading volumes.
          </p>

          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Macro Indicators Explained
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div style={{ padding: '16px', background: 'var(--bg-surface-glass)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '8px' }}>Risk Appetite Index</h4>
              <p style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
                Based on methodologies similar to the Goldman Sachs Risk Appetite Indicator, this composite index measures the willingness of investors to take on risk. A reading above zero indicates risk-on sentiment (investors favoring equities, high-yield bonds, and emerging markets), while readings below zero signal risk-off behavior (flight to safe havens like treasuries and gold). The index aggregates signals from credit spreads, equity volatility, commodity prices, and cross-asset correlations.
              </p>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-surface-glass)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '8px' }}>TACO Index (Treasury-Adjusted Credit Overlay)</h4>
              <p style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
                The TACO Index is a composite measure that overlays credit market conditions onto treasury yield dynamics. It captures the spread between investment-grade corporate bond yields and risk-free treasury rates, adjusted for inflation expectations. Rising TACO values suggest tightening credit conditions and potential stress in the corporate bond market, while declining values indicate easing financial conditions and increased credit availability.
              </p>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-surface-glass)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '8px' }}>CAPE Ratio (Cyclically Adjusted Price-to-Earnings)</h4>
              <p style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
                Developed by Nobel laureate Robert Shiller, the CAPE ratio (also known as the Shiller P/E) smooths out earnings volatility by dividing the current price of a stock index by the average of ten years of inflation-adjusted earnings. A high CAPE suggests that equities are expensive relative to historical earnings, while a low CAPE may indicate undervaluation. The long-term average CAPE for the S&amp;P 500 is approximately 17, and readings significantly above this level have historically preceded periods of lower future returns.
              </p>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-surface-glass)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '8px' }}>Real Yield Tracker</h4>
              <p style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
                Real yields represent the return on bonds after accounting for inflation. They are calculated by subtracting the expected inflation rate (typically derived from TIPS breakeven rates) from the nominal treasury yield. Positive real yields mean bondholders earn a return above inflation, while negative real yields erode purchasing power. Real yields are a critical input for equity valuations, currency dynamics, and the relative attractiveness of different asset classes.
              </p>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-surface-glass)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '8px' }}>Market Leverage Indicators</h4>
              <p style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
                Market leverage metrics track the degree to which investors are using borrowed capital to amplify their market positions. This includes margin debt levels, leveraged ETF flows, and options market leverage ratios. High leverage levels can amplify both gains and losses, and historically elevated margin debt has been associated with increased market fragility and larger drawdowns during corrections.
              </p>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-surface-glass)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '8px' }}>IAK Recommendation Index</h4>
              <p style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
                The IAK (Institutional Analyst Konsensus) Recommendation Index aggregates analyst recommendations across major investment banks and research firms. It tracks the distribution of buy, hold, and sell ratings for market sectors, providing a consensus view of institutional sentiment. Shifts in the IAK can signal changes in institutional positioning and are often leading indicators of sector rotation.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Market Glossary */}
        <section style={{ marginTop: '24px', padding: '32px 24px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', letterSpacing: '-0.5px' }}>
            Market Glossary
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {[
              { term: 'Market Breadth', definition: 'A measure of how many stocks are advancing versus declining. Strong breadth (more advancers) confirms a healthy rally, while weak breadth during a rising market signals potential divergence.' },
              { term: 'Trading Volume', definition: 'The total number of shares or contracts traded during a given period. High volume confirms the strength of a price move, while low volume may indicate lack of conviction.' },
              { term: 'Risk-On / Risk-Off', definition: 'Market regimes where investors either seek higher-risk assets (risk-on) like equities and commodities, or flee to safe havens (risk-off) like treasuries, gold, and the US dollar.' },
              { term: 'Credit Spread', definition: 'The difference in yield between a corporate bond and a risk-free government bond of the same maturity. Widening spreads indicate growing credit risk and often precede economic slowdowns.' },
              { term: 'Sector Rotation', definition: 'The movement of investment capital from one industry sector to another as investors anticipate the next phase of the economic cycle. Defensive sectors outperform in late-cycle, while cyclicals lead in early-cycle.' },
              { term: 'Margin Debt', definition: 'Money borrowed from brokerages to purchase securities. Rising margin debt indicates increasing leverage and bullish sentiment, but extreme levels historically correlate with market tops.' },
              { term: 'Breakeven Inflation Rate', definition: 'The difference between nominal treasury yields and TIPS (Treasury Inflation-Protected Securities) yields, representing the market\'s expectation for average inflation over the bond\'s maturity.' },
              { term: 'Volatility Index (VIX)', definition: 'Often called the "fear gauge," the VIX measures expected 30-day volatility of the S&P 500 derived from options prices. Readings above 30 indicate high fear, while readings below 15 suggest complacency.' },
            ].map((item, idx) => (
              <div key={idx} style={{ padding: '14px', background: 'var(--bg-surface-glass)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>{item.term}</strong>
                <p style={{ fontSize: '12px', lineHeight: '1.7', color: 'var(--text-secondary)', margin: 0 }}>{item.definition}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section: FAQ */}
        <section style={{ marginTop: '24px', padding: '32px 24px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', letterSpacing: '-0.5px' }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { q: 'What data sources does AeroTrade use?', a: 'AeroTrade aggregates real-time market data from the Finnhub financial data API, which sources information from major stock exchanges worldwide. Price quotes, volume data, and index values are updated every few seconds during market hours. Our macro indicators are calculated using established financial methodologies applied to this live data.' },
              { q: 'Is the data delayed or real-time?', a: 'Market data is sourced via the Finnhub API and is generally near-real-time during active trading sessions. Some data points may have a slight delay depending on exchange rules and data licensing. The dashboard polls for updates every 5 seconds to provide the most current view available.' },
              { q: 'How are the macro indexes calculated?', a: 'Each macro index follows established financial methodologies. The Risk Appetite Index uses a multi-factor model similar to Goldman Sachs\' approach, combining credit spreads, volatility, and cross-asset signals. The CAPE ratio uses Professor Robert Shiller\'s cyclically adjusted P/E methodology. The TACO Index is a proprietary composite overlaying credit conditions onto treasury dynamics. All calculations are updated in real time as new data flows in.' },
              { q: 'Can I use AeroTrade for trading decisions?', a: 'AeroTrade is designed as an informational and educational tool for monitoring macro market conditions. It is NOT financial advice and should not be used as the sole basis for investment decisions. Always conduct your own research and consult with a licensed financial advisor before making investment decisions. See our full Disclaimer for more information.' },
              { q: 'Which market indexes are tracked?', a: 'AeroTrade tracks five major global market indexes: the S&P 500 (via SPY ETF), NASDAQ 100 (via QQQ ETF), Dow Jones Industrial Average (via DIA ETF), FTSE 100 (via EWU ETF), and Nikkei 225 (via EWJ ETF). Individual stock tracking covers a broad universe of large-cap US equities across all major sectors.' },
              { q: 'What does the treemap heatmap show?', a: 'The treemap heatmap visualizes individual stock performance where tile size represents relative trading volume and color represents price change direction and magnitude. Green tiles indicate stocks with positive price changes, red tiles show declines, and the intensity of color reflects the magnitude of the move. This allows you to instantly spot which sectors and stocks are leading or lagging the market.' },
            ].map((item, idx) => (
              <div key={idx} style={{ padding: '16px', background: 'var(--bg-surface-glass)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{item.q}</h3>
                <p style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--text-secondary)', margin: 0 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* === SITE NAVIGATION FOOTER === */}
      <footer style={{ 
        marginTop: '32px', 
        padding: '32px 24px', 
        background: 'var(--bg-surface)', 
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-volume) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px', color: 'var(--color-bg-deep)' }}>A</div>
          <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>AeroTrade</span>
        </div>
        <nav style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px', fontSize: '13px' }}>
          <a href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Home</a>
          <a href="/about" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>About</a>
          <a href="/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>
          <a href="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Terms of Service</a>
          <a href="/disclaimer" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Disclaimer</a>
          <a href="/contact" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Contact</a>
        </nav>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '600px', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '8px' }}>AeroTrade is an informational platform for tracking macro market indicators. All data is sourced from public APIs and is provided for educational purposes only. This site does not provide financial advice.</p>
          <p>© {new Date().getFullYear()} AeroTrade. All rights reserved.</p>
        </div>
      </footer>

      {/* Stock detail Modal Overlay */}
      {selectedStock && (
        <StockDetailsModal 
          key={selectedStock.symbol} /* Force unmount/remount on selection changes to clear internal state */
          stock={selectedStock} 
          onClose={() => setSelectedStock(null)} 
        />
      )}


    </div>
  );
}
