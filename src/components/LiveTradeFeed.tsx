'use client';

import React, { useState, useRef } from 'react';
import { TradeTick } from '../utils/marketDataSim';
import { Activity, ShieldAlert, Award } from 'lucide-react';

interface LiveTradeFeedProps {
  ticks: TradeTick[];
}

export default function LiveTradeFeed({ ticks }: LiveTradeFeedProps) {
  const [filterBlockTrades, setFilterBlockTrades] = useState(false);
  const containerEndRef = useRef<HTMLDivElement>(null);

  const formatSize = (size: number) => {
    return size.toLocaleString();
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  // Filter ticks based on user selection
  const displayedTicks = filterBlockTrades 
    ? ticks.filter(t => t.isBlockTrade) 
    : ticks;

  // Compute stats for current visible list or last 100 ticks
  const totalTrades = ticks.length;
  const blockTrades = ticks.filter(t => t.isBlockTrade).length;
  const buyVolume = ticks.filter(t => t.side === 'buy').reduce((sum, t) => sum + t.size, 0);
  const sellVolume = ticks.filter(t => t.side === 'sell').reduce((sum, t) => sum + t.size, 0);
  const totalVolume = buyVolume + sellVolume || 1;
  const buyPercent = Math.round((buyVolume / totalVolume) * 100);
  const sellPercent = 100 - buyPercent;

  return (
    <div className="glass-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px', background: 'var(--bg-surface-glass)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} style={{ color: 'var(--color-gain-bright)' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live Order Stream</span>
        </div>
        <button
          onClick={() => setFilterBlockTrades(!filterBlockTrades)}
          style={{
            background: filterBlockTrades ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            border: `1px solid ${filterBlockTrades ? 'var(--color-volume)' : 'var(--border-color)'}`,
            borderRadius: '6px',
            color: filterBlockTrades ? 'var(--color-volume)' : 'var(--text-secondary)',
            padding: '4px 8px',
            fontSize: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
        >
          {filterBlockTrades ? 'Showing Blocks Only' : 'Filter Blocks'}
        </button>
      </div>

      {/* Stream Stats Dashboard */}
      <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.03)', fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
          <span>Total Executions: <strong style={{ color: 'white' }}>{totalTrades}</strong></span>
          <span>Block Trades: <strong style={{ color: 'var(--color-volume)' }}>{blockTrades}</strong></span>
        </div>
        
        {/* Buy/Sell Volume Ratio Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 600 }}>
            <span style={{ color: 'var(--color-gain-bright)' }}>BUY {buyPercent}%</span>
            <span style={{ color: 'var(--color-loss-bright)' }}>SELL {sellPercent}%</span>
          </div>
          <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', display: 'flex', overflow: 'hidden' }}>
            <div style={{ width: `${buyPercent}%`, height: '100%', background: 'var(--color-gain-bright)', transition: 'width 0.3s ease' }}></div>
            <div style={{ width: `${sellPercent}%`, height: '100%', background: 'var(--color-loss-bright)', transition: 'width 0.3s ease' }}></div>
          </div>
        </div>
      </div>

      {/* Scrolling Stream Area */}
      <div 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '6px', 
          paddingRight: '4px',
          maxHeight: '100%'
        }}
      >
        {displayedTicks.length === 0 ? (
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '11px', padding: '24px 0' }}>
            <ShieldAlert size={20} style={{ marginBottom: '6px' }} />
            <span>Waiting for market ticks...</span>
          </div>
        ) : (
          displayedTicks.map((tick) => {
            const sideColor = tick.side === 'buy' ? 'var(--color-gain-bright)' : 'var(--color-loss-bright)';
            const sideBg = tick.side === 'buy' ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)';
            
            return (
              <div
                key={tick.id}
                style={{
                  background: tick.isBlockTrade ? 'rgba(245, 158, 11, 0.08)' : sideBg,
                  border: `1px solid ${tick.isBlockTrade ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.02)'}`,
                  borderRadius: '6px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: tick.isBlockTrade ? '0 0 10px rgba(245, 158, 11, 0.05)' : 'none',
                  animation: 'fade-in-up 0.2s ease-out'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {formatTime(tick.timestamp)}
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '12px', color: 'white' }}>{tick.symbol}</span>
                  
                  {tick.isBlockTrade && (
                    <span 
                      style={{ 
                        fontSize: '8px', 
                        fontWeight: 800, 
                        background: 'var(--color-volume)', 
                        color: '#080b11', 
                        padding: '1px 4px', 
                        borderRadius: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <Award size={8} /> BLOCK
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'monospace' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {formatSize(tick.size)}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: sideColor }}>
                    ${tick.price.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={containerEndRef} />
      </div>
    </div>
  );
}
