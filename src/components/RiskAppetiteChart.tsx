"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Activity, RefreshCw } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────
interface RiskDataPoint {
  date: string;
  riskIndex: number;
  zCredit: number;
  zVix: number;
  zSpyIef: number;
  zOilGold: number;
}

interface RiskAppetiteResponse {
  data: RiskDataPoint[];
  current: {
    riskIndex: number;
    regime: 'Risk On' | 'Neutral' | 'Risk Off';
    zCredit: number;
    zVix: number;
    zSpyIef: number;
    zOilGold: number;
  };
  lastUpdate: number;
}

type Timeframe = '30d' | '60d' | '90d';

// ─── Color helpers ───────────────────────────────────────────────────
function getRiskColor(value: number): string {
  if (value >= 70) return '#00e676';
  if (value >= 55) return '#00c3ff';
  if (value >= 45) return '#ffab00';
  if (value >= 30) return '#ff9100';
  return '#ff1744';
}

function getRiskGlow(value: number): string {
  if (value >= 70) return 'rgba(0, 230, 118, 0.4)';
  if (value >= 55) return 'rgba(0, 195, 255, 0.3)';
  if (value >= 45) return 'rgba(255, 171, 0, 0.3)';
  if (value >= 30) return 'rgba(255, 145, 0, 0.3)';
  return 'rgba(255, 23, 68, 0.4)';
}

function getRegimeLabel(value: number): string {
  if (value >= 70) return 'RISK ON';
  if (value >= 55) return 'LEANING RISK ON';
  if (value >= 45) return 'NEUTRAL';
  if (value >= 30) return 'LEANING RISK OFF';
  return 'RISK OFF';
}

function getRegimeIcon(value: number) {
  if (value >= 55) return <TrendingUp size={14} />;
  if (value >= 45) return <Minus size={14} />;
  return <TrendingDown size={14} />;
}

// ─── Custom Tooltip ──────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: RiskDataPoint }>; label?: string }) {
  if (!active || !payload || !payload[0]) return null;

  const dp = payload[0].payload;
  const value = dp.riskIndex;
  const color = getRiskColor(value);

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${color}`,
        borderRadius: '10px',
        padding: '12px 16px',
        backdropFilter: 'blur(12px)',
        boxShadow: `0 4px 20px ${getRiskGlow(value)}`,
        minWidth: '180px',
      }}
    >
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span
          style={{
            fontSize: '22px',
            fontWeight: 900,
            fontFamily: 'monospace',
            color,
          }}
        >
          {value.toFixed(1)}
        </span>
        <span
          style={{
            fontSize: '9px',
            fontWeight: 800,
            color,
            background: `${color}18`,
            padding: '2px 6px',
            borderRadius: '4px',
            letterSpacing: '0.5px',
          }}
        >
          {getRegimeLabel(value)}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '9px' }}>
        {[
          { label: 'Credit (HYG)', value: dp.zCredit },
          { label: 'VIX', value: dp.zVix },
          { label: 'SPY/IEF', value: dp.zSpyIef },
          { label: 'Oil/Gold', value: dp.zOilGold },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
            <span
              style={{
                fontWeight: 700,
                fontFamily: 'monospace',
                color: item.value > 0 ? 'var(--color-gain-bright)' : item.value < 0 ? 'var(--color-loss-bright)' : 'var(--text-muted)',
              }}
            >
              {item.value > 0 ? '+' : ''}{item.value.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Component Z-Score Bar ───────────────────────────────────────────
function ZScoreBar({ label, value, icon }: { label: string; value: number; icon: string }) {
  const barWidth = Math.min(Math.abs(value) * 30, 100);
  const isPositive = value >= 0;
  const color = isPositive ? 'var(--color-gain-bright)' : 'var(--color-loss-bright)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
      <span style={{ width: '14px', textAlign: 'center', fontSize: '12px' }}>{icon}</span>
      <span style={{ width: '60px', color: 'var(--text-secondary)', fontWeight: 700, whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '6px', background: 'var(--bg-panel)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            [isPositive ? 'left' : 'right']: '50%',
            width: `${barWidth / 2}%`,
            height: '100%',
            background: color,
            borderRadius: '3px',
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: `0 0 8px ${isPositive ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
          }}
        />
        {/* Center marker */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '-1px',
            width: '1px',
            height: '8px',
            background: 'var(--text-muted)',
            transform: 'translateX(-0.5px)',
          }}
        />
      </div>
      <span
        style={{
          width: '44px',
          textAlign: 'right',
          fontWeight: 800,
          fontFamily: 'monospace',
          fontSize: '10px',
          color,
        }}
      >
        {value > 0 ? '+' : ''}{value.toFixed(2)}
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function RiskAppetiteChart() {
  const [data, setData] = useState<RiskAppetiteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('60d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      const response = await fetch('/api/risk-appetite');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: RiskAppetiteResponse = await response.json();
      if (result.data && result.data.length > 0) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch risk appetite data:', err);
      setError('Unable to load risk data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(() => fetchData(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Filter data based on timeframe
  const filteredData = useMemo(() => {
    if (!data) return [];
    const days = timeframe === '30d' ? 30 : timeframe === '60d' ? 60 : 90;
    return data.data.slice(-days);
  }, [data, timeframe]);

  // Current value
  const currentValue = data?.current?.riskIndex ?? 50;
  const currentColor = getRiskColor(currentValue);
  const currentGlow = getRiskGlow(currentValue);

  // Chart gradient ID (unique to avoid SVG conflicts)
  const gradientId = 'riskAppetiteGradient';
  const glowGradientId = 'riskAppetiteGlow';

  // ─── Loading state ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="glass-panel"
        style={{
          height: '100%',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          minHeight: '280px',
        }}
      >
        <Activity size={28} style={{ color: 'var(--color-accent)', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '1px' }}>
          COMPUTING RISK APPETITE INDEX...
        </span>
        <div style={{ height: '3px', width: '120px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
          <div
            style={{
              width: '50%',
              height: '100%',
              background: 'var(--color-accent)',
              position: 'absolute',
              animation: 'indeterminate-slide 1.5s infinite ease-in-out',
            }}
          />
        </div>
      </div>
    );
  }

  // ─── Error state ───────────────────────────────────────────────────
  if (error && !data) {
    return (
      <div
        className="glass-panel"
        style={{
          height: '100%',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          minHeight: '280px',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-loss-bright)' }}>{error}</span>
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: 'var(--color-accent)',
            background: 'transparent',
            border: '1px solid var(--color-accent)',
            borderRadius: '6px',
            padding: '4px 12px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // ─── Main render ───────────────────────────────────────────────────
  return (
    <div
      className="glass-panel"
      style={{
        height: '100%',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-surface-glass)',
        transition: 'all 0.5s ease',
        minHeight: '320px',
      }}
    >
      {/* ─── Header Row ─────────────────────────────────────────────── */}
      <div
        className="risk-appetite-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        {/* Title + Current Value */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div>
            <h2
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Activity size={14} style={{ color: currentColor }} />
              GS RISK APPETITE INDEX
            </h2>
            <p style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
              Goldman Sachs Proxy • {timeframe === '30d' ? '30 Day' : timeframe === '60d' ? '60 Day' : '90 Day'} View
            </p>
          </div>

          {/* Live value badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: `${currentColor}12`,
              border: `1px solid ${currentColor}40`,
              borderRadius: '10px',
              padding: '6px 14px',
              boxShadow: `0 0 20px ${currentGlow}`,
              transition: 'all 0.6s ease',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: currentColor,
                boxShadow: `0 0 10px ${currentColor}`,
                display: 'inline-block',
                animation: 'pulse-dot 2s ease-in-out infinite',
              }}
            />
            <span
              style={{
                fontSize: '20px',
                fontWeight: 900,
                fontFamily: 'monospace',
                color: currentColor,
                letterSpacing: '-1px',
              }}
            >
              {currentValue.toFixed(1)}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
              <span
                style={{
                  fontSize: '8px',
                  fontWeight: 800,
                  color: currentColor,
                  letterSpacing: '0.8px',
                  lineHeight: '1.2',
                }}
              >
                {getRegimeLabel(currentValue)}
              </span>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                {getRegimeIcon(currentValue)}
              </span>
            </div>
          </div>
        </div>

        {/* Controls: Timeframe + Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '3px' }}>
            {(['30d', '60d', '90d'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  background: timeframe === tf ? `${currentColor}18` : 'transparent',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${timeframe === tf ? currentColor : 'var(--border-color)'}`,
                  fontSize: '10px',
                  fontWeight: 800,
                  color: timeframe === tf ? currentColor : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '4px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            title="Refresh data"
          >
            <RefreshCw size={12} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* ─── Chart + Components Layout ──────────────────────────────── */}
      <div
        className="risk-appetite-body"
        style={{
          flex: 1,
          display: 'flex',
          gap: '14px',
          minHeight: '200px',
        }}
      >
        {/* Chart Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <AreaChart data={filteredData} margin={{ top: 5, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={currentColor} stopOpacity={0.35} />
                  <stop offset="50%" stopColor={currentColor} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={currentColor} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id={glowGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={currentColor} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={currentColor} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--grid-line)"
                horizontal={true}
                vertical={false}
              />

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 600 }}
                minTickGap={50}
                tickFormatter={(d: string) => {
                  const date = new Date(d + 'T00:00:00');
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />

              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 600 }}
                ticks={[0, 30, 50, 70, 100]}
              />

              {/* Risk Off zone line */}
              <ReferenceLine
                y={30}
                stroke="#ff1744"
                strokeDasharray="6 4"
                strokeOpacity={0.5}
                strokeWidth={1}
              />

              {/* Neutral line */}
              <ReferenceLine
                y={50}
                stroke="var(--text-muted)"
                strokeDasharray="4 4"
                strokeOpacity={0.4}
                strokeWidth={1}
              />

              {/* Risk On zone line */}
              <ReferenceLine
                y={70}
                stroke="#00e676"
                strokeDasharray="6 4"
                strokeOpacity={0.5}
                strokeWidth={1}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="riskIndex"
                stroke={currentColor}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                animationDuration={1500}
                animationEasing="ease-out"
                dot={false}
                activeDot={{
                  r: 5,
                  stroke: currentColor,
                  strokeWidth: 2,
                  fill: 'var(--bg-surface)',
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ─── Component Breakdown Sidebar ───────────────────────────── */}
        {data?.current && (
          <div
            className="risk-appetite-sidebar"
            style={{
              width: '200px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {/* Gauge-like visual */}
            <div
              style={{
                background: 'var(--bg-panel)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                border: '1px solid var(--border-color)',
              }}
            >
              <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px' }}>
                RISK GAUGE
              </span>

              {/* Horizontal bar gauge */}
              <div style={{ position: 'relative', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, #ff1744 0%, #ff9100 25%, #ffab00 45%, #00c3ff 65%, #00e676 100%)',
                    borderRadius: '4px',
                    opacity: 0.4,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    left: `${currentValue}%`,
                    transform: 'translateX(-50%)',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: currentColor,
                    border: '2px solid var(--bg-surface)',
                    boxShadow: `0 0 8px ${currentGlow}`,
                    transition: 'left 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--text-muted)', fontWeight: 700 }}>
                <span>FEAR</span>
                <span>GREED</span>
              </div>
            </div>

            {/* Z-Score Components */}
            <div
              style={{
                background: 'var(--bg-panel)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                border: '1px solid var(--border-color)',
                flex: 1,
              }}
            >
              <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '2px' }}>
                Z-SCORE COMPONENTS
              </span>

              <ZScoreBar label="Credit" value={data.current.zCredit} icon="💳" />
              <ZScoreBar label="VIX" value={data.current.zVix} icon="📊" />
              <ZScoreBar label="SPY/IEF" value={data.current.zSpyIef} icon="⚖️" />
              <ZScoreBar label="Oil/Gold" value={data.current.zOilGold} icon="🛢️" />

              {/* Formula hint */}
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-color)',
                  fontSize: '8px',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  lineHeight: '1.4',
                }}
              >
                25 × (ΣZ) + 50 → [0, 100]
                <br />
                60-day rolling z-scores
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
