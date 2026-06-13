'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import StockTreemap from '../components/StockTreemap';
import GlobalVolumeMap from '../components/GlobalVolumeMap';
import LiveTradeFeed from '../components/LiveTradeFeed';
import StockDetailsModal from '../components/StockDetailsModal';
import { Play, Pause, AlertTriangle, Zap, Layers, Globe, RefreshCw } from 'lucide-react';

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
  
  // Dashboard navigation tab
  const [activeTab, setActiveTab] = useState<'treemap' | 'geomap'>('treemap');
  
  // Simulation Controls
  const [simulationRunning, setSimulationRunning] = useState(true);
  const [simSpeedMs, setSimSpeedMs] = useState<number>(300); // Ticks every 300ms by default (Fast update)
  const [marketEventMessage, setMarketEventMessage] = useState<string | null>(null);
  const [eventTimeout, setEventTimeout] = useState<NodeJS.Timeout | null>(null);

  // Market Indices State
  const [indices, setIndices] = useState<IndexTicker[]>([
    { name: 'S&P 500', value: 5088.80, change: 18.20, changePercent: 0.36 },
    { name: 'NASDAQ 100', value: 17985.20, change: 84.50, changePercent: 0.47 },
    { name: 'DOW JONES', value: 39131.50, change: -28.10, changePercent: -0.07 },
    { name: 'FTSE 100', value: 7684.30, change: 12.10, changePercent: 0.16 },
    { name: 'NIKKEI 225', value: 39120.50, change: 240.20, changePercent: 0.62 }
  ]);

  // Handle a simulation tick
  const handleSimulationTick = useCallback(() => {
    // 1. Generate live trade tick
    const tick = generateTick(stocks);
    
    // 2. Append to recent ticks list (limit to last 40 ticks)
    setRecentTicks(prev => {
      const next = [tick, ...prev];
      if (next.length > 40) next.pop();
      return next;
    });

    // 3. Update stock attributes
    setStocks(prevStocks => {
      const updatedStocks = applyTick(prevStocks, tick);
      
      // Update selected stock in real-time if modal is open
      if (selectedStock && selectedStock.symbol === tick.symbol) {
        const matching = updatedStocks.find(s => s.symbol === tick.symbol);
        if (matching) setSelectedStock(matching);
      }
      
      return updatedStocks;
    });

    // 4. Accumulate volume to exchanges (based on stock trade size)
    setExchanges(prevExchanges => {
      return prevExchanges.map(ex => {
        // Find if the ticked stock belongs to the sector most traded on this exchange
        // E.g., Tech for NYSE/NASDAQ/SSE, Energy/Healthcare for FSE/LSE
        const matchingStock = stocks.find(s => s.symbol === tick.symbol);
        if (!matchingStock) return ex;

        const isMainVolumeDriver = ex.topStockSymbol === tick.symbol;
        
        // Add fractional volume based on trade size
        // Size represents shares; approximate value = size * price
        const tradeValueB = (tick.price * tick.size) / 1000000000;
        
        // Scale factor: add fraction to make volumes look dynamic but stable
        const volIncrement = tradeValueB * (isMainVolumeDriver ? 4.0 : 1.2);
        
        return {
          ...ex,
          volume: Number((ex.volume + volIncrement).toFixed(2))
        };
      });
    });

    // 5. Update index metrics based on aggregate stock behavior
    setIndices(prevIndices => {
      return prevIndices.map(ind => {
        // Technologies heavy NASDAQ, broader S&P, Industrial DOW
        let weightFactor = 0.0001;
        if (ind.name === 'NASDAQ 100') {
          // Tech weight
          const techAvgChange = stocks
            .filter(s => s.sector === 'Technology')
            .reduce((sum, s) => sum + s.priceChangePercent, 0) / 6;
          weightFactor = techAvgChange * 0.08;
        } else if (ind.name === 'S&P 500') {
          const marketAvgChange = stocks.reduce((sum, s) => sum + s.priceChangePercent, 0) / stocks.length;
          weightFactor = marketAvgChange * 0.05;
        } else {
          weightFactor = (Math.random() - 0.485) * 0.02; // Random walk
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
  }, [stocks, selectedStock]);

  // Set up the simulation tick interval
  useEffect(() => {
    if (!simulationRunning) return;

    const interval = setInterval(handleSimulationTick, simSpeedMs);
    return () => clearInterval(interval);
  }, [simulationRunning, simSpeedMs, handleSimulationTick]);

  // Trigger Market Events
  const triggerMarketEvent = (eventType: 'spike' | 'panic') => {
    if (eventTimeout) clearTimeout(eventTimeout);

    if (eventType === 'spike') {
      setMarketEventMessage("⚡ EARNINGS SURGE: Mega-Cap Tech volume spikes +300% on record profits!");
      
      // Update stocks with immediate gains and massive volume increase
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
      
      // Update stocks with immediate deep losses
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

    // Auto-remove notification alert after 8 seconds
    const timeout = setTimeout(() => {
      setMarketEventMessage(null);
    }, 8000);
    setEventTimeout(timeout);
  };

  // Reset market data to initial settings
  const handleResetSimulation = () => {
    setStocks(INITIAL_STOCKS);
    setExchanges(INITIAL_EXCHANGES);
    setRecentTicks([]);
    setMarketEventMessage("🔄 System Reset: Simulation parameters restored to baseline.");
    
    if (eventTimeout) clearTimeout(eventTimeout);
    const timeout = setTimeout(() => setMarketEventMessage(null), 3000);
    setEventTimeout(timeout);
  };

  // Compute market summary cards
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

        {/* View Selection Navigation Tabs */}
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

        {/* Simulation Controls Panel */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Active indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '10px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: simulationRunning ? 'var(--color-gain-bright)' : 'var(--text-muted)', display: 'inline-block', boxShadow: simulationRunning ? '0 0 6px var(--color-gain-bright)' : 'none' }}></span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{simulationRunning ? 'LIVE FEED' : 'PAUSED'}</span>
          </div>

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
          >
            {simulationRunning ? <Pause size={14} /> : <Play size={14} />}
          </button>

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
            title="Reset Simulation"
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

      {/* Main Workspace Split (Treemap/Map on left, Ticker stream on right) */}
      <main style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: '10px', padding: '10px', overflow: 'hidden' }}>
        
        {/* Left Interactive Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden', height: '100%' }}>
          
          {/* Dynamic Event Alerts Panel */}
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

          {/* Active Main View (Heatmap / Globe Map) */}
          <div style={{ flex: 1, overflow: 'hidden', height: '100%' }}>
            {activeTab === 'treemap' ? (
              <StockTreemap stocks={stocks} onSelectStock={setSelectedStock} />
            ) : (
              <GlobalVolumeMap exchanges={exchanges} />
            )}
          </div>

          {/* Simulation Controls Dashboard Footer */}
          <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', background: 'rgba(10,15,28,0.4)' }}>
            
            {/* Quick Metrics */}
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

            {/* Special event trigger buttons */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              
              {/* Speed controls */}
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
            </div>

          </div>
        </div>

        {/* Right Execution Tape Sidebar (LiveTradeFeed) */}
        <aside style={{ height: '100%', overflow: 'hidden' }}>
          <LiveTradeFeed ticks={recentTicks} />
        </aside>
      </main>

      {/* Stock Details Modal Overlay */}
      {selectedStock && (
        <StockDetailsModal 
          stock={selectedStock} 
          onClose={() => setSelectedStock(null)} 
        />
      )}

    </div>
  );
}
