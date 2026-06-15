'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Exchange, Stock, isExchangeOpen } from '../utils/marketDataSim';
import { Globe, MapPin, Clock, TrendingUp, Activity, Tag } from 'lucide-react';

interface GlobalVolumeMapProps {
  exchanges: Exchange[];
  stocks: Stock[];
}

export default function GlobalVolumeMap({ exchanges, stocks }: GlobalVolumeMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [hoveredExchange, setHoveredExchange] = useState<Exchange | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [systemTime, setSystemTime] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Tick the system clock every second for exchange status calculations
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getExchangeVolume = (exchange: Exchange) => {
    // Dynamically calculate exchange volume as aggregate of stocks related to it
    // For mock realism, we map certain stocks to certain exchanges and sum their volume.
    // We also overlay a base exchange factor.
    return exchange.volume;
  };

  const getExchangeLocalTime = (exchange: Exchange) => {
    const utc = systemTime.getTime() + systemTime.getTimezoneOffset() * 60000;
    const local = new Date(utc + 3600000 * exchange.utcOffset);
    return local.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  const formatVolume = (vol: number) => {
    return `$${vol.toFixed(1)}B`;
  };

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent, exchange: Exchange, isHover: boolean) => {
    if (isMobile && isHover) return; // Disable hover interactions entirely on mobile

    if (isMobile) {
      setHoveredExchange(exchange); // On mobile, just trigger the modal state
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // The SVG has viewBox="0 0 1000 500" and preserves aspect ratio
    const scaleFactor = Math.min(rect.width / 1000, rect.height / 500);
    const offsetX = (rect.width - 1000 * scaleFactor) / 2;
    const offsetY = (rect.height - 500 * scaleFactor) / 2;

    const actualMapX = exchange.mapX * scaleFactor + offsetX;
    const actualMapY = exchange.mapY * scaleFactor + offsetY;

    const tooltipWidth = 260;
    const tooltipHeight = 180;
    
    let x = actualMapX + 15;
    let y = actualMapY + 15;

    // Prevent overflow on the right
    if (x + tooltipWidth > rect.width) {
      x = actualMapX - tooltipWidth - 15;
    }
    
    // Prevent overflow on the bottom
    if (y + tooltipHeight > rect.height) {
      y = actualMapY - tooltipHeight - 15;
    }
    
    // Prevent overflow on ultra small screens
    if (x < 10) x = 10;
    if (y < 10) y = 10;

    setHoverPos({ x, y });
    setHoveredExchange(exchange);
  };

  // Find max volume to scale circle sizes
  const maxVolume = Math.max(...exchanges.map(e => e.volume), 1);

  // Filter exchanges based on search
  const filteredExchanges = exchanges.filter(e => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return e.name.toLowerCase().includes(q) || e.city.toLowerCase().includes(q) || e.country.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      {/* Control Panel */}
      <div className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Globe size={18} style={{ color: 'var(--color-accent)' }} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Global Exchange Map</span>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-accent)', display: 'inline-block', boxShadow: '0 0 6px var(--color-accent)' }}></span>
              <span>Open / Active</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-neutral)', display: 'inline-block' }}></span>
              <span>Closed</span>
            </div>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search exchange or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'var(--bg-overlay-light)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              width: '180px',
              outline: 'none',
              transition: 'border-color var(--transition-fast)'
            }}
          />
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div ref={containerRef} className="glass-panel" style={{ flex: 1, position: 'relative', background: 'var(--bg-surface-glass)', minHeight: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        <svg 
          viewBox="0 0 1000 500" 
          width="100%" 
          height="100%" 
          style={{ maxWidth: '100%', maxHeight: '100%', display: 'block' }}
          onClick={() => setHoveredExchange(null)}
        >
          {/* Grid lines for sci-fi look */}
          <defs>
            <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="var(--grid-line)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="1000" height="500" fill="url(#grid)" />

          {/* Stylized high-tech world map paths (Simplified land outlines) */}
          <g style={{ opacity: 0.85 }}>
            {/* North America */}
            <path d="M 80,80 L 120,60 L 220,50 L 320,100 L 270,160 L 230,170 L 245,210 L 230,230 L 225,230 L 210,185 L 180,180 L 165,200 L 155,190 L 165,160 L 140,150 L 130,110 Z" className="map-country" />
            {/* Greenland */}
            <path d="M 315,35 L 360,30 L 370,55 L 330,75 Z" className="map-country" />
            {/* South America */}
            <path d="M 228,240 L 275,250 L 290,280 L 275,340 L 240,430 L 225,430 L 232,330 L 210,290 L 218,255 Z" className="map-country" />
            {/* Eurasia / Africa */}
            <path d="M 380,110 L 460,85 L 750,75 L 890,95 L 900,140 L 895,195 L 850,235 L 830,235 L 805,260 L 780,230 L 720,225 L 700,245 L 675,225 L 610,235 L 565,230 L 525,240 L 465,220 L 452,175 L 390,170 Z" className="map-country" />
            {/* UK / Ireland */}
            <path d="M 485,90 L 495,85 L 498,95 L 488,100 Z" className="map-country" />
            {/* Japan */}
            <path d="M 885,135 L 895,145 L 888,160 L 880,150 Z" className="map-country" />
            {/* Africa */}
            <path d="M 435,210 L 500,200 L 538,215 L 585,245 L 560,315 L 520,375 L 490,415 L 480,415 L 472,305 L 440,275 L 428,235 Z" className="map-country" />
            {/* India (Slightly detailed to visual shape) */}
            <path d="M 690,195 L 710,195 L 715,220 L 698,225 Z" className="map-country" />
            {/* Australia */}
            <path d="M 825,320 L 885,310 L 905,335 L 895,375 L 845,375 L 815,335 Z" className="map-country" />
            {/* New Zealand */}
            <path d="M 925,380 L 935,395 L 920,405 Z" className="map-country" />
            {/* Madagascar */}
            <path d="M 575,325 L 585,345 L 580,355 L 570,335 Z" className="map-country" />
          </g>

          {/* Render Exchange Markers */}
          {filteredExchanges.map((exchange) => {
            const isOpen = isExchangeOpen(exchange, systemTime);
            const sizeRatio = exchange.volume / maxVolume; // 0.05 to 1.0
            const radius = 5 + sizeRatio * 16;
            
            return (
              <g 
                key={exchange.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => handleInteraction(e, exchange, true)}
                onMouseMove={(e) => handleInteraction(e, exchange, true)}
                onMouseLeave={() => !isMobile && setHoveredExchange(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleInteraction(e, exchange, false);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  handleInteraction(e, exchange, false);
                }}
              >
                {/* Glow ring if open */}
                {isOpen ? (
                  <>
                    <circle 
                      cx={exchange.mapX} 
                      cy={exchange.mapY} 
                      r={radius * 1.8} 
                      fill="none" 
                      stroke="var(--color-accent)" 
                      strokeWidth="1.5"
                      style={{
                        animation: 'pulse-ring 2s infinite',
                        transformOrigin: `${exchange.mapX}px ${exchange.mapY}px`
                      }}
                    />
                    <circle 
                      cx={exchange.mapX} 
                      cy={exchange.mapY} 
                      r={radius} 
                      fill="var(--color-accent)"
                      opacity="0.8"
                      style={{
                        filter: 'drop-shadow(0 0 8px var(--color-accent))',
                        animation: 'pulse-dot 2.5s infinite',
                        transformOrigin: `${exchange.mapX}px ${exchange.mapY}px`,
                        '--pulse-color': 'rgba(59, 130, 246, 0.7)'
                      } as React.CSSProperties}
                    />
                  </>
                ) : (
                  <circle 
                    cx={exchange.mapX} 
                    cy={exchange.mapY} 
                    r={radius} 
                    fill="var(--color-neutral)" 
                    opacity="0.75"
                    stroke="var(--border-color)"
                    strokeWidth="1"
                  />
                )}
                
                {/* Node Center core */}
                <circle 
                  cx={exchange.mapX} 
                  cy={exchange.mapY} 
                  r="3.5" 
                  fill="var(--text-primary)"
                />

                {/* Exchange name abbreviation text tag */}
                <text
                  x={exchange.mapX}
                  y={exchange.mapY - radius - 5}
                  textAnchor="middle"
                  fill="rgba(255, 255, 255, 0.8)"
                  fontSize="9px"
                  fontWeight="700"
                  style={{
                    textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                    pointerEvents: 'none',
                    letterSpacing: '0.2px'
                  }}
                >
                  {exchange.city}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Info Tooltip Card / Mobile Bottom Sheet */}
        {hoveredExchange && (() => {
          const content = (
            <div
              className={`map-tooltip animate-fade-in`}
              style={isMobile ? {
                position: 'fixed',
                top: 0, left: 0,
                width: '100vw', height: '100vh',
                background: 'var(--bg-overlay-heavy)',
                backdropFilter: 'blur(8px)',
                zIndex: 9999,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px'
              } : {
                left: `${hoverPos.x}px`,
                top: `${hoverPos.y}px`,
              }}
              onClick={() => isMobile && setHoveredExchange(null)}
            >
              <div 
                className={isMobile ? "glass-panel" : ""}
                style={isMobile ? { background: 'var(--bg-surface)', padding: '20px', width: '100%', maxWidth: '400px', maxHeight: '100%', overflowY: 'auto' } : {}}
                onClick={(e) => isMobile && e.stopPropagation()}
              >
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <h4 style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>{hoveredExchange.name}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', color: 'var(--text-secondary)', fontSize: '10px' }}>
                  <MapPin size={10} />
                  <span>{hoveredExchange.city}, {hoveredExchange.country}</span>
                </div>
              </div>
              
              {/* Trading status badge */}
              {isExchangeOpen(hoveredExchange, systemTime) ? (
                <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-gain-bright)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '4px' }}>
                  OPEN
                </span>
              ) : (
                <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', background: 'var(--bg-overlay-light)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                  CLOSED
                </span>
              )}
            </div>

            <div style={{ borderBottom: '1px solid var(--grid-line)', margin: '6px 0' }}></div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={11} /> Local Time:
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{getExchangeLocalTime(hoveredExchange)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={11} /> Market Volume:
                </span>
                <span style={{ fontWeight: 700, color: 'var(--color-volume)' }}>{formatVolume(getExchangeVolume(hoveredExchange))}</span>
              </div>
              
              <div style={{ borderBottom: '1px solid var(--grid-line)', margin: '4px 0' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Activity size={11} /> Top Driver:
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{hoveredExchange.topStockSymbol}</span>
              </div>
              {(() => {
                const driverStock = stocks.find(s => s.symbol === hoveredExchange.topStockSymbol);
                if (!driverStock) return null;
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Tag size={11} /> Focus Sector:
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{driverStock.sector}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <TrendingUp size={11} /> Trade Volume:
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{new Intl.NumberFormat('en-US').format(driverStock.volume)}</span>
                    </div>
                  </>
                );
              })()}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Hours (Local):</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {String(hoveredExchange.openHour).padStart(2, '0')}:{String(hoveredExchange.openMinute).padStart(2, '0')} - {String(hoveredExchange.closeHour).padStart(2, '0')}:{String(hoveredExchange.closeMinute).padStart(2, '0')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>UTC Offset:</span>
                <span style={{ color: 'var(--text-primary)' }}>{hoveredExchange.utcOffset >= 0 ? '+' : ''}{hoveredExchange.utcOffset} hrs</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Top Volume Driver:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{hoveredExchange.topStockSymbol}</span>
              </div>
            </div>
            
              {isMobile && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <button 
                    onClick={() => setHoveredExchange(null)}
                    style={{ background: 'var(--bg-overlay-light)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, width: '100%' }}
                  >
                    Close
                  </button>
                </div>
              )}
              </div>
            </div>
          );
          
          return isMobile && typeof document !== 'undefined' 
            ? createPortal(content, document.body) 
            : content;
        })()}
      </div>
    </div>
  );
}
