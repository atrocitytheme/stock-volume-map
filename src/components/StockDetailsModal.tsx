'use client';

import React, { useState, useEffect } from 'react';
import { Stock, generateOrderBook, OrderBook } from '../utils/marketDataSim';
import { X, TrendingUp, BarChart2, DollarSign, Database, Activity } from 'lucide-react';

interface StockDetailsModalProps {
  stock: Stock;
  onClose: () => void;
}

export default function StockDetailsModal({ stock, onClose }: StockDetailsModalProps) {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(() => generateOrderBook(stock));

  // Generate order book and refresh periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setOrderBook(generateOrderBook(stock));
    }, 1500);

    return () => clearInterval(interval);
  }, [stock]);

  // Compute SVG chart parameters
  const chartPoints = stock.history;
  const minPrice = Math.min(...chartPoints, stock.openPrice, stock.low) * 0.999;
  const maxPrice = Math.max(...chartPoints, stock.openPrice, stock.high) * 1.001;
  const priceRange = maxPrice - minPrice || 1;

  const svgWidth = 460;
  const svgHeight = 160;
  const padding = 12;
  const plotWidth = svgWidth - padding * 2;
  const plotHeight = svgHeight - padding * 2;

  // Generate path data
  const points = chartPoints.map((price, idx) => {
    const x = padding + (idx / (chartPoints.length - 1)) * plotWidth;
    const y = padding + plotHeight - ((price - minPrice) / priceRange) * plotHeight;
    return { x, y };
  });

  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(svgHeight - padding).toFixed(1)} L ${points[0].x.toFixed(1)} ${(svgHeight - padding).toFixed(1)} Z` 
    : '';

  const chartColor = stock.priceChangePercent >= 0 ? 'var(--color-gain-bright)' : 'var(--color-loss-bright)';
  const chartGradientId = `chart-grad-${stock.symbol}`;

  const formatLargeNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    return num.toLocaleString();
  };

  // Price progress inside daily range
  const rangePercent = Math.min(Math.max(((stock.price - stock.low) / (stock.high - stock.low || 1)) * 100, 0), 100);

  return (
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
          maxWidth: '850px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 24px 50px rgba(0,0,0,0.6)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'white' }}>{stock.symbol}</h2>
            <h3 style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{stock.name}</h3>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
              {stock.sector} • {stock.industry}
            </span>
          </div>
          
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '50%',
              transition: 'background var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body Container */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          {/* Left Column: Chart & Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Price Box */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: 'white', fontFamily: 'monospace' }}>
                ${stock.price.toFixed(2)}
              </span>
              <span 
                style={{ 
                  fontSize: '15px', 
                  fontWeight: 700, 
                  color: stock.priceChange >= 0 ? 'var(--color-gain-bright)' : 'var(--color-loss-bright)',
                  fontFamily: 'monospace'
                }}
              >
                {stock.priceChange >= 0 ? '+' : ''}{stock.priceChange.toFixed(2)} ({stock.priceChangePercent >= 0 ? '+' : ''}{stock.priceChangePercent}%)
              </span>
            </div>

            {/* SVG Candlestick / Line Chart */}
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={11} /> 24H Price Trend
                </span>
                <span>High: ${maxPrice.toFixed(2)} | Low: ${minPrice.toFixed(2)}</span>
              </div>
              <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ display: 'block' }}>
                <defs>
                  <linearGradient id={chartGradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={chartColor} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Horizontal reference grids */}
                <line x1="12" y1={padding} x2={svgWidth - 12} y2={padding} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="12" y1={padding + plotHeight / 2} x2={svgWidth - 12} y2={padding + plotHeight / 2} stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3" />
                <line x1="12" y1={svgHeight - padding} x2={svgWidth - 12} y2={svgHeight - padding} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                
                {/* Reference line for open price */}
                {stock.openPrice >= minPrice && stock.openPrice <= maxPrice && (
                  <line 
                    x1="12" 
                    y1={padding + plotHeight - ((stock.openPrice - minPrice) / priceRange) * plotHeight} 
                    x2={svgWidth - 12} 
                    y2={padding + plotHeight - ((stock.openPrice - minPrice) / priceRange) * plotHeight} 
                    stroke="rgba(255, 255, 255, 0.15)" 
                    strokeWidth="0.75" 
                    strokeDasharray="2,4" 
                  />
                )}

                {/* Plot Area */}
                {areaPath && <path d={areaPath} fill={`url(#${chartGradientId})`} />}
                {linePath && <path d={linePath} fill="none" stroke={chartColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              </svg>
            </div>

            {/* General Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BarChart2 size={11} /> Volume
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'white', fontFamily: 'monospace' }}>
                  {formatLargeNumber(stock.volume)}
                </span>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                  Avg: {formatLargeNumber(stock.avgVolume)}
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <DollarSign size={11} /> VWAP
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'white', fontFamily: 'monospace' }}>
                  ${stock.vwap.toFixed(2)}
                </span>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                  Volume-weighted price
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Activity size={11} /> Relative Vol (RVOL)
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: stock.relativeVolume >= 1.5 ? 'var(--color-volume)' : 'white', fontFamily: 'monospace' }}>
                  {stock.relativeVolume}x
                </span>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                  Ratio to normal volume
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Database size={11} /> Market Cap
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'white', fontFamily: 'monospace' }}>
                  ${stock.marketCap.toFixed(1)}B
                </span>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                  Total equity value
                </span>
              </div>
            </div>

            {/* Daily High/Low progress bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Daily Low: <strong style={{ color: 'white' }}>${stock.low.toFixed(2)}</strong></span>
                <span>Daily High: <strong style={{ color: 'white' }}>${stock.high.toFixed(2)}</strong></span>
              </div>
              <div style={{ position: 'relative', height: '6px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', marginTop: '2px' }}>
                <div 
                  style={{ 
                    position: 'absolute', 
                    left: `${rangePercent}%`, 
                    top: '-3px', 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    background: 'white', 
                    border: `2px solid ${chartColor}`,
                    transform: 'translateX(-50%)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.5)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Order Book (Depth) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Activity size={14} style={{ color: 'var(--color-accent)' }} />
              <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'white' }}>
                Live Order Depth (L2)
              </span>
            </div>

            {orderBook ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                
                {/* ASKS (Sells) Table - Rendered top-down or bottom-up. Usually Asks are rendered red from highest down to lowest ask at the middle */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '4px 6px', fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    <span>Ask Price</span>
                    <span style={{ textAnchor: 'end', textAlign: 'right' }}>Size</span>
                    <span style={{ textAnchor: 'end', textAlign: 'right' }}>Total Depth</span>
                  </div>
                  
                  {/* Reverse asks so lowest ask is at the bottom, closest to the spread */}
                  {[...orderBook.asks].reverse().map((ask, idx) => {
                    const maxCum = Math.max(...orderBook.asks.map(a => a.cumulativeSize), 1);
                    const depthPercent = (ask.cumulativeSize / maxCum) * 100;
                    
                    return (
                      <div 
                        key={`ask-${idx}`}
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr 1fr', 
                          padding: '5px 6px', 
                          fontSize: '11px',
                          position: 'relative',
                          background: 'rgba(239, 68, 68, 0.02)',
                          borderBottom: '1px solid rgba(255,255,255,0.01)',
                          fontFamily: 'monospace'
                        }}
                      >
                        {/* Horizontal volume depth visualization bar */}
                        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${depthPercent}%`, background: 'rgba(239, 68, 68, 0.065)', zIndex: 0, pointerEvents: 'none' }}></div>
                        
                        <span style={{ color: 'var(--color-loss-bright)', fontWeight: 600, zIndex: 1 }}>${ask.price.toFixed(2)}</span>
                        <span style={{ textAlign: 'right', color: 'white', zIndex: 1 }}>{ask.size.toLocaleString()}</span>
                        <span style={{ textAlign: 'right', color: 'var(--text-secondary)', zIndex: 1 }}>{ask.cumulativeSize.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>

                {/* SPREAD INDICATOR */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Bid/Ask Spread:</span>
                  <span style={{ color: 'white', fontFamily: 'monospace' }}>
                    $0.10 ({(0.10 / stock.price * 100).toFixed(3)}%)
                  </span>
                </div>

                {/* BIDS (Buys) Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  {orderBook.bids.map((bid, idx) => {
                    const maxCum = Math.max(...orderBook.bids.map(b => b.cumulativeSize), 1);
                    const depthPercent = (bid.cumulativeSize / maxCum) * 100;

                    return (
                      <div 
                        key={`bid-${idx}`}
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr 1fr', 
                          padding: '5px 6px', 
                          fontSize: '11px',
                          position: 'relative',
                          background: 'rgba(16, 185, 129, 0.02)',
                          borderBottom: '1px solid rgba(255,255,255,0.01)',
                          fontFamily: 'monospace'
                        }}
                      >
                        {/* Horizontal volume depth visualization bar */}
                        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${depthPercent}%`, background: 'rgba(16, 185, 129, 0.065)', zIndex: 0, pointerEvents: 'none' }}></div>
                        
                        <span style={{ color: 'var(--color-gain-bright)', fontWeight: 600, zIndex: 1 }}>${bid.price.toFixed(2)}</span>
                        <span style={{ textAlign: 'right', color: 'white', zIndex: 1 }}>{bid.size.toLocaleString()}</span>
                        <span style={{ textAlign: 'right', color: 'var(--text-secondary)', zIndex: 1 }}>{bid.cumulativeSize.toLocaleString()}</span>
                      </div>
                    );
                  })}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '4px 6px', fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    <span>Bid Price</span>
                    <span style={{ textAnchor: 'end', textAlign: 'right' }}>Size</span>
                    <span style={{ textAnchor: 'end', textAlign: 'right' }}>Total Depth</span>
                  </div>
                </div>

              </div>
            ) : (
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
                Loading depth book...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
