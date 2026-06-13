'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Stock, 
  Exchange, 
  TradeTick, 
  INITIAL_STOCKS, 
  INITIAL_EXCHANGES, 
  generateTick, 
  applyTick, 
  isExchangeOpen 
} from '../utils/marketDataSim';
import {
  normalizeQuote,
  fetchAllQuotesStaggered,
  normalizeWSTrade,
  FinnhubWSMessage,
  FinnhubWSTradeItem
} from '../utils/finnhubService';
import StockTreemap from '../components/StockTreemap';
import GlobalVolumeMap from '../components/GlobalVolumeMap';
import LiveTradeFeed from '../components/LiveTradeFeed';
import StockDetailsModal from '../components/StockDetailsModal';
import { Play, Pause, AlertTriangle, Zap, Layers, Globe, RefreshCw, Settings, Info } from 'lucide-react';

interface IndexTicker {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export default function Home() {
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);
  const [exchanges, setExchanges] = useState<Exchange[]>(INITIAL_EXCHANGES);
  const [recentTicks, setRecentTicks] = useState<TradeTick[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  
  // Tab View
  const [activeTab, setActiveTab] = useState<'treemap' | 'geomap'>('treemap');
  
  // Mock Simulation Controls
  const [simulationRunning, setSimulationRunning] = useState(true);
  const [simSpeedMs, setSimSpeedMs] = useState<number>(300);
  
  // Market Scenarios & Alerts
  const [marketEventMessage, setMarketEventMessage] = useState<string | null>(null);
  const [eventTimeout, setEventTimeout] = useState<NodeJS.Timeout | null>(null);

  // Finnhub API Key & WebSocket States (Lazily initialized on client to prevent synchronous setState warnings)
  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('finnhub_api_key') || '';
    }
    return '';
  });
  const [apiInputKey, setApiInputKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('finnhub_api_key') || '';
    }
    return '';
  });
  const [isApiActive, setIsApiActive] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // Progressive REST loader status
  const [loadingQuotes, setLoadingQuotes] = useState<boolean>(false);
  const [loadProgress, setLoadProgress] = useState<{ current: number; total: number; symbol: string }>({ current: 0, total: 0, symbol: '' });

  // Web Socket Refs
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  
  // Market Closed detector
  const [lastTickTime, setLastTickTime] = useState<number | null>(null);
  const [showMarketClosedAlert, setShowMarketClosedAlert] = useState<boolean>(false);

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
    setLastTickTime(Date.now());
    setShowMarketClosedAlert(false);

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

  // Connect to Finnhub WebSockets
  const connectWebSocket = useCallback((token: string) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const ws = new WebSocket(`wss://ws.finnhub.io?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Finnhub WebSocket Connected');
        setWsConnected(true);
        setLastTickTime(Date.now());

        // Subscribe to all stock tickers
        INITIAL_STOCKS.forEach(stock => {
          ws.send(JSON.stringify({ type: 'subscribe', symbol: stock.symbol }));
        });
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data) as FinnhubWSMessage;
        if (message.type === 'trade' && message.data) {
          message.data.forEach(tradeItem => {
            handleLiveTrade(tradeItem);
          });
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
      };

      ws.onclose = () => {
        console.log('Finnhub WebSocket Closed');
        setWsConnected(false);
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
    }
  }, [handleLiveTrade]);

  // Activate Live Market Mode (wrapped in useCallback to satisfy dependency rules)
  const activateLiveMarket = useCallback(async (token: string) => {
    setLoadingQuotes(true);
    setSimulationRunning(false); // Pause mock simulation
    
    const symbols = INITIAL_STOCKS.map(s => s.symbol);
    
    try {
      // 1. Fetch startup quotes progressively (respects 60 calls/min rate limits)
      await fetchAllQuotesStaggered(symbols, token, (index, total, symbol, quote) => {
        setLoadProgress({ current: index, total, symbol });
        setStocks(prevStocks => {
          return prevStocks.map(stock => {
            if (stock.symbol === symbol) {
              return normalizeQuote(stock, quote);
            }
            return stock;
          });
        });
      });

      setLoadingQuotes(false);
      setIsApiActive(true);

      // 2. Open live WebSocket connection
      connectWebSocket(token);
    } catch (err) {
      console.error('Staggered loading failed:', err);
      setLoadingQuotes(false);
      setMarketEventMessage("❌ API Error: Failed to retrieve market quotes. Verify your API key.");
      setTimeout(() => setMarketEventMessage(null), 5000);
    }
  }, [connectWebSocket]);

  // Load API Key on Startup (placed after activateLiveMarket definition to resolve hoisting errors)
  useEffect(() => {
    const savedKey = localStorage.getItem('finnhub_api_key');
    if (savedKey) {
      const timer = setTimeout(() => {
        activateLiveMarket(savedKey);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activateLiveMarket]);

  // Monitor Live Ticks for Market Closed (no ticks received in live mode)
  useEffect(() => {
    if (!isApiActive || !wsConnected) {
      return;
    }

    const checkInterval = setInterval(() => {
      const now = Date.now();
      if (lastTickTime && now - lastTickTime > 15000) {
        setShowMarketClosedAlert(true);
      } else {
        setShowMarketClosedAlert(false);
      }
    }, 5000);

    return () => {
      clearInterval(checkInterval);
      setShowMarketClosedAlert(false); // Clean up on unmount or mode changes
    };
  }, [isApiActive, wsConnected, lastTickTime]);

  // Save Settings Modal Handler
  const handleSaveSettings = () => {
    if (!apiInputKey.trim()) {
      // Clear key
      localStorage.removeItem('finnhub_api_key');
      setApiKey('');
      setIsApiActive(false);
      if (wsRef.current) wsRef.current.close();
      setSimulationRunning(true);
    } else {
      // Save and boot
      const key = apiInputKey.trim();
      localStorage.setItem('finnhub_api_key', key);
      setApiKey(key);
      activateLiveMarket(key);
    }
    setShowSettings(false);
  };

  // Force simulation fallback (when market is closed)
  const handleMarketClosedFallback = () => {
    setIsApiActive(false);
    setShowMarketClosedAlert(false);
    if (wsRef.current) {
      wsRef.current.close();
    }
    setSimulationRunning(true);
    setMarketEventMessage("🔄 Falling back to Mock Simulation (Market Closed/Inactive).");
    setTimeout(() => setMarketEventMessage(null), 4000);
  };

  // Handle a simulation tick (mock data runner)
  const handleSimulationTick = useCallback(() => {
    if (isApiActive) return; // Skip if live data is running

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
    if (!simulationRunning || isApiActive) return;

    const interval = setInterval(handleSimulationTick, simSpeedMs);
    return () => clearInterval(interval);
  }, [simulationRunning, simSpeedMs, handleSimulationTick, isApiActive]);

  // Clean up socket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
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
      // If live, reload quotes
      activateLiveMarket(apiKey);
      return;
    }
    setStocks(INITIAL_STOCKS);
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
          background: 'rgba(16, 21, 36, 0.7)' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-volume) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '15px', color: '#080b11', boxShadow: '0 0 12px var(--color-accent-glow)' }}>
            A
          </div>
          <div>
            <h1 style={{ fontSize: '15px', fontWeight: 900, color: 'white', letterSpacing: '0.8px' }}>AEROTRADE</h1>
            <p style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 500 }}>Live Volume Heatmap Terminal</p>
          </div>
        </div>

        {/* Loading progress bar for staggered quotes */}
        {loadingQuotes && (
          <div style={{ flex: 1, maxWidth: '280px', margin: '0 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 700, color: 'var(--color-volume)' }}>
              <span>LOADING LIVE API QUOTES...</span>
              <span>{loadProgress.current}/{loadProgress.total} ({loadProgress.symbol})</span>
            </div>
            <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${(loadProgress.current / loadProgress.total) * 100}%`, 
                  height: '100%', 
                  background: 'var(--color-volume)',
                  transition: 'width 0.2s ease' 
                }}
              ></div>
            </div>
          </div>
        )}

        {/* View Selection Navigation Tabs */}
        {!loadingQuotes && (
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveTab('treemap')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: activeTab === 'treemap' ? 'var(--color-accent)' : 'transparent',
                border: 'none',
                color: activeTab === 'treemap' ? '#080b11' : 'white',
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
                color: activeTab === 'geomap' ? '#080b11' : 'white',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '10px' }}>
            <span 
              style={{ 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                backgroundColor: isApiActive 
                  ? (wsConnected ? 'var(--color-gain-bright)' : 'var(--color-volume)') 
                  : (simulationRunning ? 'var(--color-accent)' : 'var(--text-muted)'), 
                display: 'inline-block', 
                boxShadow: isApiActive && wsConnected 
                  ? '0 0 6px var(--color-gain-bright)' 
                  : isApiActive ? '0 0 6px var(--color-volume)' : simulationRunning ? '0 0 6px var(--color-accent)' : 'none' 
              }}
            ></span>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '9px' }}>
              {isApiActive 
                ? (wsConnected ? 'LIVE MARKET (WS)' : 'LIVE MARKET (CONNECTING)') 
                : (simulationRunning ? 'MOCK SIMULATION' : 'SIM PAUSED')}
            </span>
          </div>

          {/* Play/Pause (Simulation only) */}
          {!isApiActive && (
            <button
              onClick={() => setSimulationRunning(!simulationRunning)}
              style={{
                background: simulationRunning ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
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

          {/* Settings button */}
          <button
            onClick={() => {
              setApiInputKey(apiKey);
              setShowSettings(true);
            }}
            style={{
              background: isApiActive ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
              border: `1px solid ${isApiActive ? 'var(--color-volume)' : 'var(--border-color)'}`,
              borderRadius: '6px',
              color: isApiActive ? 'var(--color-volume)' : 'white',
              padding: '5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="API Key Configuration"
          >
            <Settings size={14} />
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
          background: 'rgba(5, 7, 12, 0.4)',
          borderStyle: 'dashed'
        }}
      >
        {indices.map((idx, index) => {
          const isUp = idx.changePercent >= 0;
          return (
            <div key={`index-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>{idx.name}</span>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'white' }}>{idx.value.toLocaleString()}</span>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '10px', color: isUp ? 'var(--color-gain-bright)' : 'var(--color-loss-bright)' }}>
                {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{idx.changePercent}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Split Grid */}
      <main style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: '10px', padding: '10px', overflow: 'hidden' }}>
        
        {/* Left Interactive Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden', height: '100%' }}>
          
          {/* Market Closed Warning Banner */}
          {showMarketClosedAlert && (
            <div 
              className="glass-panel animate-fade-in" 
              style={{ 
                padding: '8px 14px', 
                background: 'rgba(245, 158, 11, 0.08)', 
                borderLeft: '4px solid var(--color-volume)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'white'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={14} style={{ color: 'var(--color-volume)' }} />
                <span>⚠️ Live Feed Inactive: The US stock market is currently closed or inactive.</span>
              </div>
              <button
                onClick={handleMarketClosedFallback}
                style={{
                  background: 'var(--color-volume)',
                  border: 'none',
                  color: '#080b11',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '9px',
                  fontWeight: 800
                }}
              >
                Resume Mock Simulation
              </button>
            </div>
          )}

          {/* Event notifications alert */}
          {marketEventMessage && (
            <div 
              className="glass-panel animate-fade-in" 
              style={{ 
                padding: '8px 14px', 
                background: marketEventMessage.startsWith('⚡') ? 'rgba(59, 130, 246, 0.08)' : 'rgba(239, 68, 68, 0.08)', 
                borderLeft: `4px solid ${marketEventMessage.startsWith('⚡') ? 'var(--color-accent)' : 'var(--color-loss-bright)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'white'
              }}
            >
              {marketEventMessage.startsWith('⚡') ? <Zap size={14} style={{ color: 'var(--color-accent)' }} /> : <AlertTriangle size={14} style={{ color: 'var(--color-loss-bright)' }} />}
              <span>{marketEventMessage}</span>
            </div>
          )}

          {/* Primary visualization pane */}
          <div style={{ flex: 1, overflow: 'hidden', height: '100%' }}>
            {activeTab === 'treemap' ? (
              <StockTreemap stocks={stocks} onSelectStock={setSelectedStock} />
            ) : (
              <GlobalVolumeMap exchanges={exchanges} />
            )}
          </div>

          {/* Footer Controls Dashboard */}
          <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', background: 'rgba(10,15,28,0.4)' }}>
            
            {/* Quick Stats */}
            <div style={{ display: 'flex', gap: '24px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <div>
                Traded Shares: <strong style={{ color: 'white', fontFamily: 'monospace' }}>{totalTradedVolShares.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                Breadth: 
                <span style={{ color: 'var(--color-gain-bright)', fontWeight: 700 }}>{stocksUp} ▲</span>
                <span style={{ color: 'var(--color-loss-bright)', fontWeight: 700 }}>{stocksDown} ▼</span>
              </div>
              <div>
                Active Markets: <strong style={{ color: 'white' }}>{activeExchangesCount} / {exchanges.length}</strong>
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

        {/* Right Execution log */}
        <aside style={{ height: '100%', overflow: 'hidden' }}>
          <LiveTradeFeed ticks={recentTicks} />
        </aside>
      </main>

      {/* Stock detail Modal Overlay */}
      {selectedStock && (
        <StockDetailsModal 
          key={selectedStock.symbol} /* Force unmount/remount on selection changes to clear internal state */
          stock={selectedStock} 
          onClose={() => setSelectedStock(null)} 
        />
      )}

      {/* Settings Modal (Finnhub API Key Config) */}
      {showSettings && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(5, 7, 12, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px'
          }}
        >
          <div 
            className="glass-panel animate-fade-in"
            style={{
              background: '#0c0f17',
              width: '100%',
              maxWidth: '450px',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 24px 50px rgba(0,0,0,0.6)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'white' }}>Settings</h3>
              <button 
                onClick={() => setShowSettings(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
            
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}></div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>FINNHUB API KEY</label>
              <input
                type="text"
                value={apiInputKey}
                onChange={(e) => setApiInputKey(e.target.value)}
                placeholder="Paste your Finnhub token here..."
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: 'white',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                You can get a free token by signing up at <a href="https://finnhub.io/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>finnhub.io</a>. Leave blank to disable and restore mock data.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                style={{
                  background: 'var(--color-accent)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#080b11',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Save & Connect
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
