'use client';

import React, { useState, useEffect, useRef } from 'react';
import { treemap as d3Treemap, hierarchy as d3Hierarchy, HierarchyRectangularNode } from 'd3-hierarchy';
import { Stock } from '../utils/marketDataSim';
import { Search, Layers } from 'lucide-react';

interface StockTreemapProps {
  stocks: Stock[];
  onSelectStock?: (stock: Stock) => void;
  isDataFlashing?: boolean;
}

interface TreemapNode {
  name: string;
  children?: TreemapNode[];
  symbol?: string;
  value?: number;
  stock?: Stock;
}

export default function StockTreemap({ stocks, onSelectStock, isDataFlashing }: StockTreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
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

  // Filter stocks to Top 5 Volume and Top 5 Market Cap
  const topVolume = [...stocks].sort((a, b) => b.volume - a.volume).slice(0, 5);
  const topMarketCap = [...stocks].sort((a, b) => b.marketCap - a.marketCap).slice(0, 5);
  
  // Combine and remove duplicates by symbol
  const topStockSymbols = new Set([...topVolume, ...topMarketCap].map(s => s.symbol));
  const filteredStocks = stocks.filter(s => topStockSymbols.has(s.symbol));

  // Group stocks by sector and build hierarchy using only the filtered stocks
  const sectors = Array.from(new Set(filteredStocks.map(s => s.sector)));
  
  const hierarchyData: TreemapNode = {
    name: 'market',
    children: sectors.map(sector => {
      const sectorStocks = filteredStocks.filter(s => s.sector === sector);
      return {
        name: sector,
        children: sectorStocks.map(stock => ({
          name: stock.symbol,
          symbol: stock.symbol,
          value: stock.volume,
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



          {/* Search bar */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search ticker, sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'var(--bg-overlay-light)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px 12px',
                color: 'var(--text-primary)',
                fontSize: '11px',
                width: '180px',
                outline: 'none',
                transition: 'border-color var(--transition-fast)'
              }}
            />
          </div>
      </div>

      {/* Main Treemap Visualization Container */}
      <div 
        ref={containerRef} 
        className="glass-panel treemap-container" 
        style={{ 
          flex: 1, 
          position: 'relative', 
          overflow: 'hidden', 
          background: isDataFlashing ? 'var(--bg-gain-faded)' : 'var(--bg-surface-glass)',
          boxShadow: isDataFlashing ? 'inset 0 0 50px rgba(16, 185, 129, 0.15)' : 'none',
          transition: 'all 0.5s ease',
          minHeight: '400px',
          display: stocks.length === 0 ? 'flex' : 'block',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {stocks.length === 0 && (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            <Layers size={32} style={{ color: 'var(--grid-line)', margin: '0 auto 12px auto' }} />
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Market Data Syncing...</p>
            <p style={{ fontSize: '11px' }}>Establishing secure connection to market proxy...</p>
          </div>
        )}
        
        {/* Render Sector Titles & Borders */}
        {stocks.length > 0 && root.children && root.children.map((sectorNode, idx) => {
          const s = sectorNode as unknown as HierarchyRectangularNode<TreemapNode>;
          const w = s.x1 - s.x0;
          const h = s.y1 - s.y0;

          if (w < 40 || h < 30) return null;

          return (
            <div
              key={`sector-${s.data.name}-${idx}`}
              className="treemap-sector"
              style={{
                position: 'absolute',
                left: `${s.x0}px`,
                top: `${s.y0}px`,
                width: `${w}px`,
                height: `${h}px`,
                pointerEvents: 'none',
                border: '1px solid var(--grid-line)',
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
                  color: 'var(--text-muted)',
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
          const stock = leaf.data.stock as Stock | undefined;
          
          if (!stock) return null;
          
          const w = leaf.x1 - leaf.x0;
          const h = leaf.y1 - leaf.y0;

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
          const isHighVolume = stock.relativeVolume >= 1.5;

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
              onClick={() => onSelectStock?.(stock)}
              onMouseMove={(e) => handleMouseMove(e, stock)}
              onMouseLeave={() => setHoveredStock(null)}
              className={`treemap-leaf ${flashClass}`}
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
              <span 
                className="treemap-symbol"
                style={{ 
                  display: w > 32 && h > 28 ? 'block' : 'none',
                  fontSize: w > 50 ? '13px' : '10px', 
                  fontWeight: 700, 
                  color: '#ffffff',
                  textShadow: '0 1px 3px rgba(0,0,0,0.6)' 
                }}
              >
                {stock.symbol}
              </span>
              
              <span 
                className="treemap-percent"
                style={{ 
                  display: w > 48 && h > 42 ? 'block' : 'none',
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
              
              <span 
                className="treemap-vol"
                style={{ 
                  display: w > 72 && h > 58 ? 'block' : 'none',
                  fontSize: '9px', 
                  color: 'rgba(255, 255, 255, 0.65)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                  marginTop: '1px'
                }}
              >
                {`Vol: ${formatLargeNumber(stock.volume)}`}
              </span>
              
              <span 
                className="treemap-sector-badge"
                style={{ 
                  display: w > 80 && h > 70 ? 'block' : 'none',
                  fontSize: '8.5px', 
                  color: 'rgba(255, 255, 255, 0.8)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  marginTop: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {stock.sector}
              </span>
            </div>
          );
        })}

        {/* Hover Tooltip Render / Mobile Full Screen Dialog */}
        {hoveredStock && (
          <div
            className="map-tooltip animate-fade-in"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
            }}
            onClick={() => setHoveredStock(null)}
            onTouchStart={() => {}}
          >
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div>
                <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>{hoveredStock.symbol}</span>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Price:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${hoveredStock.price.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Sector Focus:</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{hoveredStock.sector}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Est. Volume:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{hoveredStock.volume.toLocaleString()} shares</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Market Cap:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${hoveredStock.marketCap.toFixed(1)}B</span>
                </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Relative Vol (RVOL):</span>
                <span 
                  style={{ 
                    fontWeight: 700, 
                    color: hoveredStock.relativeVolume >= 1.5 ? 'var(--color-volume)' : 'var(--text-primary)',
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
            
            <div className="mobile-tooltip-close-hint" style={{ display: 'none' }}>
              Tap anywhere to close
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
