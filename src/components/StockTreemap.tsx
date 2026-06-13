'use client';

import React, { useState, useEffect, useRef } from 'react';
import { treemap as d3Treemap, hierarchy as d3Hierarchy, HierarchyRectangularNode } from 'd3-hierarchy';
import { Stock } from '../utils/marketDataSim';
import { Search, Layers } from 'lucide-react';

interface StockTreemapProps {
  stocks: Stock[];
  onSelectStock: (stock: Stock) => void;
}

interface TreemapNode {
  name: string;
  children?: TreemapNode[];
  symbol?: string;
  value?: number;
  stock?: Stock;
}

export default function StockTreemap({ stocks, onSelectStock }: StockTreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [sizeMetric, setSizeMetric] = useState<'volume' | 'marketCap'>('volume');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredStock, setHoveredStock] = useState<Stock | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Handle resizing of the container
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ 
        width: Math.max(width, 400), 
        height: Math.max(height, 350) 
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Helper to determine block color based on price change percent
  const getStockColorClass = (changePercent: number) => {
    if (changePercent >= 2.0) return 'var(--color-gain-bright)';
    if (changePercent >= 0.75) return 'var(--color-gain-medium)';
    if (changePercent > 0) return 'var(--color-gain-dark)';
    if (changePercent === 0) return 'var(--color-neutral)';
    if (changePercent >= -0.75) return 'var(--color-loss-dark)';
    if (changePercent >= -2.0) return 'var(--color-loss-medium)';
    return 'var(--color-loss-bright)';
  };

  // Group stocks by sector and build hierarchy
  const sectors = Array.from(new Set(stocks.map(s => s.sector)));
  
  const hierarchyData: TreemapNode = {
    name: 'market',
    children: sectors.map(sector => {
      const sectorStocks = stocks.filter(s => s.sector === sector);
      return {
        name: sector,
        children: sectorStocks.map(stock => ({
          name: stock.symbol,
          symbol: stock.symbol,
          value: sizeMetric === 'volume' ? stock.volume : stock.marketCap * 10000000, // Scale market cap to align values
          stock
        }))
      };
    })
  };

  // Compute treemap layout
  const root = d3Hierarchy(hierarchyData)
    .sum(d => d.value || 0)
    .sort((a, b) => (b.value || 0) - (a.value || 0));

  const treemapLayout = d3Treemap<TreemapNode>()
    .size([dimensions.width, dimensions.height])
    .paddingOuter(4)
    .paddingTop(18)
    .paddingInner(1.5);

  treemapLayout(root);

  // Filter leaves and filter matching search
  const leaves = root.leaves();

  const handleMouseMove = (e: React.MouseEvent, stock: Stock) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Shift tooltip so it doesn't clip off the screen
    const tooltipWidth = 260;
    const tooltipHeight = 160;
    
    let x = e.clientX - rect.left + 15;
    let y = e.clientY - rect.top + 15;
    
    if (x + tooltipWidth > dimensions.width) {
      x = e.clientX - rect.left - tooltipWidth - 10;
    }
    if (y + tooltipHeight > dimensions.height) {
      y = e.clientY - rect.top - tooltipHeight - 10;
    }

    setTooltipPos({ x, y });
    setHoveredStock(stock);
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      {/* Control Bar */}
      <div className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Layers size={18} style={{ color: 'var(--color-accent)' }} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Market Map View</span>
        </div>

        {/* View toggles */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setSizeMetric('volume')}
              style={{
                background: sizeMetric === 'volume' ? 'var(--color-neutral)' : 'transparent',
                border: 'none',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                transition: 'background var(--transition-fast)'
              }}
            >
              Trading Volume
            </button>
            <button
              onClick={() => setSizeMetric('marketCap')}
              style={{
                background: sizeMetric === 'marketCap' ? 'var(--color-neutral)' : 'transparent',
                border: 'none',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                transition: 'background var(--transition-fast)'
              }}
            >
              Market Cap
            </button>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search ticker, sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px 10px 6px 30px',
                color: 'white',
                fontSize: '12px',
                width: '180px',
                outline: 'none',
                transition: 'border-color var(--transition-fast)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Treemap Visualization Container */}
      <div 
        ref={containerRef} 
        className="glass-panel" 
        style={{ 
          flex: 1, 
          position: 'relative', 
          overflow: 'hidden', 
          background: 'rgba(5, 7, 12, 0.5)',
          minHeight: '400px'
        }}
      >
        {/* Render Sector Titles & Borders */}
        {root.children && root.children.map((sectorNode, idx) => {
          const s = sectorNode as unknown as HierarchyRectangularNode<TreemapNode>;
          const w = s.x1 - s.x0;
          const h = s.y1 - s.y0;

          if (w < 40 || h < 30) return null;

          return (
            <div
              key={`sector-${s.data.name}-${idx}`}
              style={{
                position: 'absolute',
                left: `${s.x0}px`,
                top: `${s.y0}px`,
                width: `${w}px`,
                height: `${h}px`,
                pointerEvents: 'none',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                boxSizing: 'border-box'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: '4px',
                  fontSize: '9px',
                  fontWeight: 800,
                  color: 'rgba(255, 255, 255, 0.35)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: `${w - 8}px`
                }}
              >
                {s.data.name}
              </div>
            </div>
          );
        })}

        {/* Render Leaf Stocks */}
        {leaves.map((d3Leaf, idx) => {
          const leaf = d3Leaf as unknown as HierarchyRectangularNode<TreemapNode>;
          const stock = leaf.data.stock as Stock;
          const w = leaf.x1 - leaf.x0;
          const h = leaf.y1 - leaf.y0;

          // If block is too small to render, just draw an empty placeholder or skip
          if (w <= 5 || h <= 5) return null;

          const color = getStockColorClass(stock.priceChangePercent);
          
          // Match search queries
          let matchesSearch = true;
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            matchesSearch = 
              stock.symbol.toLowerCase().includes(query) || 
              stock.name.toLowerCase().includes(query) || 
              stock.sector.toLowerCase().includes(query) ||
              stock.industry.toLowerCase().includes(query);
          }

          // Relative Volume class indicator for amber highlight
          const isHighVolume = sizeMetric === 'volume' && stock.relativeVolume >= 1.5;

          // Pricing tick indicator glow class
          const flashClass = 
            stock.lastUpdateDirection === 'up' 
              ? 'flash-up' 
              : stock.lastUpdateDirection === 'down' 
                ? 'flash-down' 
                : '';

          return (
            <div
              key={`stock-node-${stock.symbol}-${idx}`}
              onClick={() => onSelectStock(stock)}
              onMouseMove={(e) => handleMouseMove(e, stock)}
              onMouseLeave={() => setHoveredStock(null)}
              className={`${flashClass}`}
              style={{
                position: 'absolute',
                left: `${leaf.x0}px`,
                top: `${leaf.y0}px`,
                width: `${w}px`,
                height: `${h}px`,
                backgroundColor: color,
                border: '1px solid rgba(0, 0, 0, 0.4)',
                borderRadius: '2px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                transition: 'opacity 0.2s ease, transform 0.15s ease',
                opacity: matchesSearch ? 1 : 0.15,
                transform: hoveredStock?.symbol === stock.symbol ? 'scale(1.01)' : 'scale(1)',
                boxShadow: isHighVolume ? 'inset 0 0 10px rgba(245, 158, 11, 0.4)' : 'none',
                zIndex: hoveredStock?.symbol === stock.symbol ? 10 : 1
              }}
            >
              {/* Render Symbol & Stats depending on size of block */}
              {w > 32 && h > 28 && (
                <span 
                  style={{ 
                    fontSize: w > 50 ? '13px' : '10px', 
                    fontWeight: 700, 
                    color: 'white',
                    textShadow: '0 1px 3px rgba(0,0,0,0.6)' 
                  }}
                >
                  {stock.symbol}
                </span>
              )}
              {w > 48 && h > 42 && (
                <span 
                  style={{ 
                    fontSize: '10px', 
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontWeight: 500,
                    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                    marginTop: '2px'
                  }}
                >
                  {stock.priceChangePercent > 0 ? '+' : ''}
                  {stock.priceChangePercent}%
                </span>
              )}
              {w > 72 && h > 58 && (
                <span 
                  style={{ 
                    fontSize: '9px', 
                    color: 'rgba(255, 255, 255, 0.65)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                    marginTop: '1px'
                  }}
                >
                  {sizeMetric === 'volume' 
                    ? `Vol: ${formatLargeNumber(stock.volume)}` 
                    : `$${stock.marketCap}B`}
                </span>
              )}
            </div>
          );
        })}

        {/* Hover Tooltip Render */}
        {hoveredStock && (
          <div
            className="glass-panel"
            style={{
              position: 'absolute',
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
              pointerEvents: 'none',
              background: 'rgba(10, 14, 23, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '12px',
              zIndex: 100,
              width: '250px',
              fontSize: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              animation: 'fade-in-up 0.15s ease-out'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div>
                <span style={{ fontWeight: 800, fontSize: '13px', color: 'white' }}>{hoveredStock.symbol}</span>
                <span style={{ color: 'var(--text-secondary)', marginLeft: '6px', fontSize: '10px' }}>{hoveredStock.name}</span>
              </div>
              <span 
                style={{ 
                  fontWeight: 700, 
                  color: hoveredStock.priceChangePercent >= 0 ? 'var(--color-gain-bright)' : 'var(--color-loss-bright)' 
                }}
              >
                {hoveredStock.priceChangePercent >= 0 ? '+' : ''}
                {hoveredStock.priceChangePercent}%
              </span>
            </div>
            
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '6px 0' }}></div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Price:</span>
                <span style={{ fontWeight: 600, color: 'white' }}>${hoveredStock.price.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Trading Volume:</span>
                <span style={{ fontWeight: 600, color: 'white' }}>{formatLargeNumber(hoveredStock.volume)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>30D Avg Vol:</span>
                <span style={{ fontWeight: 500 }}>{formatLargeNumber(hoveredStock.avgVolume)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Relative Vol (RVOL):</span>
                <span 
                  style={{ 
                    fontWeight: 700, 
                    color: hoveredStock.relativeVolume >= 1.5 ? 'var(--color-volume)' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {hoveredStock.relativeVolume}x
                  {hoveredStock.relativeVolume >= 1.5 && (
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-volume)', display: 'inline-block' }}></span>
                  )}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Market Cap:</span>
                <span style={{ fontWeight: 600 }}>${hoveredStock.marketCap.toFixed(1)}B</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
