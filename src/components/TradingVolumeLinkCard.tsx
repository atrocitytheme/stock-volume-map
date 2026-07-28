"use client";

import React from 'react';

export default function TradingVolumeLinkCard({ isDataFlashing }: { isDataFlashing?: boolean }) {
  return (
    <a
      href="https://www.tradingview.com/symbols/USI-TVOL.US/?timeframe=12M"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
        padding: '16px 20px',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        background: isDataFlashing ? 'var(--bg-gain-faded)' : 'var(--bg-surface-glass)',
        boxShadow: isDataFlashing ? 'inset 0 0 50px rgba(16, 185, 129, 0.15)' : 'none',
      }}
      className="glass-panel trading-volume-link"
    >
      {/* Left side: title & description */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0,
            boxShadow: '0 0 14px rgba(245, 158, 11, 0.3)',
          }}
        >
          📊
        </div>
        <div>
          <h2
            style={{
              fontSize: '13px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '0.5px',
              margin: 0,
            }}
          >
            TOTAL MARKET TRADING VOLUME
          </h2>
          <p
            style={{
              fontSize: '10px',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              margin: '2px 0 0 0',
            }}
          >
            USI:TVOL.US • TradingView • 12-Month View
          </p>
        </div>
      </div>

      {/* Right side: external link indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '8px 14px',
          transition: 'all 0.2s ease',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontWeight: 800,
            color: 'var(--color-volume)',
            letterSpacing: '0.5px',
          }}
        >
          VIEW ON TRADINGVIEW
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-volume)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </div>
    </a>
  );
}
