'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Stock, 
  Exchange, 
  TradeTick, 
  DEFAULT_SYMBOLS, 
  INITIAL_EXCHANGES, 
  generateTick, 
  applyTick, 
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
import MarketVolumeChart from '@/components/MarketVolumeChart';
import { Play, Pause, AlertTriangle, Zap, Layers, Globe, RefreshCw, Info, Sun, Moon } from 'lucide-react';

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
  
  // Mock Simulation Controls
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simSpeedMs, setSimSpeedMs] = useState<number>(300);
  
  // Market Scenarios & Alerts
  const [marketEventMessage, setMarketEventMessage] = useState<string | null>(null);
  const [eventTimeout, setEventTimeout] = useState<NodeJS.Timeout | null>(null);

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

  // Handle incoming live trade ticks
  const handleLiveTrade = useCallback((tradeItem: FinnhubWSTradeItem) => {

    setStocks(prevStocks => {
      const stock = prevStocks.find(s => s.symbol === tradeItem.s);
      if (!stock) return prevStocks;

      // 1. Normalize trade using latest state data
      const normalizedTick = normalizeWSTrade(tradeItem, stock.price, stock.avgVolume);

      // 2. Append to recent ticks list
      setRecentTicks(prev => {
        const next = [normalizedTick, ...prev];
        if (next.length > 40) next.pop();
        return next;
      });

      // 3. Update stock attributes
      const updatedStocks = applyTick(prevStocks, normalizedTick);

      // 4. Update selected stock inside modal
      if (selectedStock && selectedStock.symbol === normalizedTick.symbol) {
        const matching = updatedStocks.find(s => s.symbol === normalizedTick.symbol);
        if (matching) {
          // Push update safely in microtask
          setTimeout(() => setSelectedStock(matching), 0);
        }
      }

      // 5. Update exchange volumes
      setExchanges(prevExchanges => {
        return prevExchanges.map(ex => {
          const isMainVolumeDriver = ex.topStockSymbol === normalizedTick.symbol;
          const tradeValueB = (normalizedTick.price * normalizedTick.size) / 1000000000;
          const volIncrement = tradeValueB * (isMainVolumeDriver ? 4.0 : 1.2);
          return {
            ...ex,
            volume: Number((ex.volume + volIncrement).toFixed(2))
          };
        });
      });

      return updatedStocks;
    });
  }, [selectedStock]);

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
            // First load, seed volume with a baseline so it's not empty
            return data.stocks.map((s: Stock) => ({
              ...s,
              volume: s.volume > 0 ? s.volume : (s.marketCap > 0 ? s.marketCap * 15000 : 500000)
            }));
          }
          // Merge updates, preserving volume since the Finnhub REST API doesn't provide real-time volume
          const updated = data.stocks.map((newStock: Stock) => {
            const oldStock = prevStocks.find(s => s.symbol === newStock.symbol);
            if (oldStock) {
              // Add a slight random volume increment if the price changed, to simulate trading
              const volumeIncrement = newStock.price !== oldStock.price 
                ? Math.floor(newStock.avgVolume * (Math.random() * 0.0005 + 0.0001))
                : 0;
              return { ...newStock, volume: oldStock.volume + volumeIncrement };
            }
            return newStock;
          });

          return updated;
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
    }
  }, []);

  // Poll backend every 60 seconds (1 minute)
  useEffect(() => {
    fetchBackendData();
    const interval = setInterval(fetchBackendData, 60000);
    return () => clearInterval(interval);
  }, [fetchBackendData]);

  // Handle a simulation tick (mock data runner)
  const handleSimulationTick = useCallback(() => {
    if (stocks.length === 0) return; // Skip if no stocks loaded


    const tick = generateTick(stocks);
    
    setRecentTicks(prev => {
      const next = [tick, ...prev];
      if (next.length > 40) next.pop();
      return next;
    });

    setStocks(prevStocks => {
      const updatedStocks = applyTick(prevStocks, tick);
      if (selectedStock && selectedStock.symbol === tick.symbol) {
        const matching = updatedStocks.find(s => s.symbol === tick.symbol);
        if (matching) setSelectedStock(matching);
      }
      return updatedStocks;
    });

    setExchanges(prevExchanges => {
      return prevExchanges.map(ex => {
        const matchingStock = stocks.find(s => s.symbol === tick.symbol);
        if (!matchingStock) return ex;

        const isMainVolumeDriver = ex.topStockSymbol === tick.symbol;
        const tradeValueB = (tick.price * tick.size) / 1000000000;
        const volIncrement = tradeValueB * (isMainVolumeDriver ? 4.0 : 1.2);
        
        return {
          ...ex,
          volume: Number((ex.volume + volIncrement).toFixed(2))
        };
      });
    });

    setIndices(prevIndices => {
      return prevIndices.map(ind => {
        let weightFactor = 0.0001;
        if (ind.name === 'NASDAQ 100') {
          const techAvgChange = stocks
            .filter(s => s.sector === 'Technology')
            .reduce((sum, s) => sum + s.priceChangePercent, 0) / 6;
          weightFactor = techAvgChange * 0.08;
        } else if (ind.name === 'S&P 500') {
          const marketAvgChange = stocks.reduce((sum, s) => sum + s.priceChangePercent, 0) / stocks.length;
          weightFactor = marketAvgChange * 0.05;
        } else {
          weightFactor = (Math.random() - 0.485) * 0.02;
        }

        const change = ind.value * weightFactor;
        const nextValue = Number((ind.value + change).toFixed(2));
        const nextChange = Number((ind.change + change).toFixed(2));
        const nextPercent = Number(((nextChange / (ind.value - nextChange)) * 100).toFixed(2));

        return {
          ...ind,
          value: nextValue,
          change: nextChange,
          changePercent: nextPercent
        };
      });
    });
  }, [stocks, selectedStock, isApiActive]);

  // Set up the simulation tick interval
  useEffect(() => {
    if (!simulationRunning) return;

    const interval = setInterval(handleSimulationTick, simSpeedMs);
    return () => clearInterval(interval);
  }, [simulationRunning, simSpeedMs, handleSimulationTick]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Any necessary cleanup
    };
  }, []);

  // Trigger Market Scenarios (Mock only)
  const triggerMarketEvent = (eventType: 'spike' | 'panic') => {
    if (isApiActive) return; // Scenarios are disabled in live market mode

    if (eventTimeout) clearTimeout(eventTimeout);

    if (eventType === 'spike') {
      setMarketEventMessage("⚡ EARNINGS SURGE: Mega-Cap Tech volume spikes +300% on record profits!");
      
      setStocks(prevStocks => {
        return prevStocks.map(stock => {
          if (stock.sector === 'Technology') {
            const gainPercent = 2.5 + Math.random() * 3.5;
            const nextPrice = Number((stock.price * (1 + gainPercent / 100)).toFixed(2));
            return {
              ...stock,
              price: nextPrice,
              openPrice: stock.openPrice,
              volume: stock.volume + Math.floor(stock.avgVolume * 0.15),
              priceChange: Number((nextPrice - stock.openPrice).toFixed(2)),
              priceChangePercent: Number((((nextPrice - stock.openPrice) / stock.openPrice) * 100).toFixed(2)),
              lastUpdateDirection: 'up',
              relativeVolume: Number((stock.relativeVolume * 2.5).toFixed(2))
            };
          }
          return stock;
        });
      });
    } else {
      setMarketEventMessage("🚨 PANIC SELL-OFF: Inflation metrics report higher than expected! Yields spike.");
      
      setStocks(prevStocks => {
        return prevStocks.map(stock => {
          const lossPercent = 2.0 + Math.random() * 3.0;
          const nextPrice = Number((stock.price * (1 - lossPercent / 100)).toFixed(2));
          return {
            ...stock,
            price: nextPrice,
            openPrice: stock.openPrice,
            volume: stock.volume + Math.floor(stock.avgVolume * 0.12),
            priceChange: Number((nextPrice - stock.openPrice).toFixed(2)),
            priceChangePercent: Number((((nextPrice - stock.openPrice) / stock.openPrice) * 100).toFixed(2)),
            lastUpdateDirection: 'down',
            relativeVolume: Number((stock.relativeVolume * 2.0).toFixed(2))
          };
        });
      });
    }

    const timeout = setTimeout(() => {
      setMarketEventMessage(null);
    }, 8000);
    setEventTimeout(timeout);
  };

  const handleResetSimulation = () => {
    if (isApiActive) {
      // If live, reload quotes by forcing a manual poll
      fetchBackendData();
      return;
    }
    setStocks([]); // Reset to empty array instead of mock data
    setExchanges(INITIAL_EXCHANGES);
    setRecentTicks([]);
    setMarketEventMessage("🔄 System Reset: Simulation parameters restored to baseline.");
    
    if (eventTimeout) clearTimeout(eventTimeout);
    const timeout = setTimeout(() => setMarketEventMessage(null), 3000);
    setEventTimeout(timeout);
  };

  const stocksUp = stocks.filter(s => s.priceChangePercent > 0).length;
  const stocksDown = stocks.filter(s => s.priceChangePercent < 0).length;
  const totalTradedVolShares = stocks.reduce((sum, s) => sum + s.volume, 0);
  const activeExchangesCount = exchanges.filter(ex => isExchangeOpen(ex)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      
      {/* Top Header Navigation */}
      <header 
        className="glass-panel" 
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
              MARKET <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>|</span> MAPS
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>REAL-TIME ORDER FLOW & VOLUME ANALYSIS</p>
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
          <div style={{ display: 'flex', background: 'var(--bg-panel)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Active status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-panel)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '10px' }}>
            <span 
              style={{ 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                backgroundColor: isApiActive 
                  ? 'var(--color-gain-bright)' 
                  : (simulationRunning ? 'var(--color-accent)' : 'var(--text-muted)'), 
                display: 'inline-block', 
                boxShadow: isApiActive 
                  ? '0 0 6px var(--color-gain-bright)' 
                  : simulationRunning ? '0 0 6px var(--color-accent)' : 'none' 
              }}
            ></span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '9px' }}>
              {isApiActive 
                ? 'LIVE MARKET (PROXY)' 
                : (simulationRunning ? 'MOCK SIMULATION' : 'SIM PAUSED')}
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

          {/* Play/Pause (Simulation only) */}
          {!isApiActive && (
            <button
              onClick={() => setSimulationRunning(!simulationRunning)}
              style={{
                background: simulationRunning ? 'var(--bg-loss-faded)' : 'var(--bg-gain-faded)',
                border: `1px solid ${simulationRunning ? 'var(--color-loss-bright)' : 'var(--color-gain-bright)'}`,
                borderRadius: '6px',
                color: simulationRunning ? 'var(--color-loss-bright)' : 'var(--color-gain-bright)',
                padding: '5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={simulationRunning ? 'Pause Simulation' : 'Start Simulation'}
            >
              {simulationRunning ? <Pause size={14} /> : <Play size={14} />}
            </button>
          )}

          {/* Reset button */}
          <button
            onClick={handleResetSimulation}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              padding: '5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={isApiActive ? "Reload Live Quotes" : "Reset Simulation"}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      {/* Market Indices Ticker Belt */}
      <div 
        className="glass-panel"
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
                {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{idx.changePercent}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Split Grid */}
      <main 
        style={{ 
          flex: 1, 
          display: 'grid', 
          gridTemplateColumns: 'minmax(0, 1fr)', 
          gap: '10px', 
          padding: '10px', 
          overflow: 'hidden'
        }}
      >
        
        {/* Left Interactive Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden', height: '100%' }}>
          


          {/* Event notifications alert */}
          {marketEventMessage && (
            <div 
              className="glass-panel animate-fade-in" 
              style={{ 
                padding: '8px 14px', 
                background: marketEventMessage.startsWith('⚡') ? 'var(--bg-gain-faded)' : 'var(--bg-loss-faded)', 
                borderLeft: `4px solid ${marketEventMessage.startsWith('⚡') ? 'var(--color-accent)' : 'var(--color-loss-bright)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}
            >
              {marketEventMessage.startsWith('⚡') ? <Zap size={14} style={{ color: 'var(--color-accent)' }} /> : <AlertTriangle size={14} style={{ color: 'var(--color-loss-bright)' }} />}
              <span>{marketEventMessage}</span>
            </div>
          )}

          {/* Primary visualization pane */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden', height: '100%' }}>
            <div style={{ flex: 2, overflow: 'hidden' }}>
              {activeTab === 'treemap' ? (
                <StockTreemap stocks={stocks} onSelectStock={setSelectedStock} isDataFlashing={isDataFlashing} />
              ) : (
                <GlobalVolumeMap exchanges={exchanges} />
              )}
            </div>
            <div style={{ flex: 1, overflow: 'hidden', minHeight: '150px' }}>
              <MarketVolumeChart isDataFlashing={isDataFlashing} />
            </div>
          </div>

          {/* Footer Controls Dashboard */}
          <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', background: 'var(--bg-surface-glass)' }}>
            
            {/* Quick Stats */}
            <div style={{ display: 'flex', gap: '24px', fontSize: '11px', color: 'var(--text-secondary)' }}>
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

            {/* Scenario triggers (Mock mode only) */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              
              {/* Simulation speed adjustment */}
              {!isApiActive && (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', borderRight: '1px solid var(--border-color)', paddingRight: '12px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>Speed:</span>
                  <button
                    onClick={() => setSimSpeedMs(800)}
                    style={{
                      background: simSpeedMs === 800 ? 'var(--color-neutral)' : 'transparent',
                      border: 'none',
                      color: simSpeedMs === 800 ? 'white' : 'var(--text-secondary)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '9px',
                      fontWeight: 700
                    }}
                  >
                    1x
                  </button>
                  <button
                    onClick={() => setSimSpeedMs(300)}
                    style={{
                      background: simSpeedMs === 300 ? 'var(--color-neutral)' : 'transparent',
                      border: 'none',
                      color: simSpeedMs === 300 ? 'white' : 'var(--text-secondary)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '9px',
                      fontWeight: 700
                    }}
                  >
                    3x
                  </button>
                  <button
                    onClick={() => setSimSpeedMs(100)}
                    style={{
                      background: simSpeedMs === 100 ? 'var(--color-neutral)' : 'transparent',
                      border: 'none',
                      color: simSpeedMs === 100 ? 'white' : 'var(--text-secondary)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '9px',
                      fontWeight: 700
                    }}
                  >
                    10x
                  </button>
                </div>
              )}

              {/* Mock events buttons */}
              {isApiActive ? (
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Mock Scenarios disabled in Live API Mode
                </span>
              ) : (
                <>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mock Scenario:</span>
                  <button
                    onClick={() => triggerMarketEvent('spike')}
                    style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid var(--color-accent)',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'background var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'}
                  >
                    <Zap size={11} style={{ color: 'var(--color-accent)' }} />
                    Tech Surge
                  </button>
                  <button
                    onClick={() => triggerMarketEvent('panic')}
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid var(--color-loss-bright)',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'background var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.22)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
                  >
                    <AlertTriangle size={11} style={{ color: 'var(--color-loss-bright)' }} />
                    Panic Dump
                  </button>
                </>
              )}
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

    </div>
  );
}
