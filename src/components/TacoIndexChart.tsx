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
import { AlertTriangle, Shield, RefreshCw, Zap } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────
interface TacoDataPoint {
  date: string;
  peakStress: number;
  zEquity: number;
  zRates: number;
  zEnergy: number;
  zVolatility: number;
}

interface TacoResponse {
  data: TacoDataPoint[];
  current: {
    peakStress: number;
    regime: 'NO PIVOT' | 'PIVOT WATCH' | 'PIVOT LIKELY' | 'PIVOT IMMINENT';
    zEquity: number;
    zRates: number;
    zEnergy: number;
    zVolatility: number;
    dominantStressor: string;
  };
  lastUpdate: number;
}

type Timeframe = '30d' | '60d' | '90d';

// ─── Color helpers ───────────────────────────────────────────────────
function getStressColor(sigma: number): string {
  if (sigma >= 3.4) return '#ff1744';    // Pivot Imminent — red
  if (sigma >= 2.9) return '#ff6d00';    // Pivot Likely — deep orange
  if (sigma >= 2.3) return '#ffab00';    // Pivot Watch — amber
  if (sigma >= 1.5) return '#00c3ff';    // Elevated — blue
  return '#00e676';                       // Calm — green
}

function getStressGlow(sigma: number): string {
  if (sigma >= 3.4) return 'rgba(255, 23, 68, 0.45)';
  if (sigma >= 2.9) return 'rgba(255, 109, 0, 0.35)';
  if (sigma >= 2.3) return 'rgba(255, 171, 0, 0.3)';
  if (sigma >= 1.5) return 'rgba(0, 195, 255, 0.25)';
  return 'rgba(0, 230, 118, 0.25)';
}

function getRegimeLabel(regime: string): string {
  switch (regime) {
    case 'PIVOT IMMINENT': return 'PIVOT IMMINENT';
    case 'PIVOT LIKELY': return 'PIVOT LIKELY';
    case 'PIVOT WATCH': return 'PIVOT WATCH';
    default: return 'NO PIVOT';
  }
}

function getRegimeIcon(regime: string) {
  switch (regime) {
    case 'PIVOT IMMINENT': return <AlertTriangle size={14} />;
    case 'PIVOT LIKELY': return <Zap size={14} />;
    case 'PIVOT WATCH': return <AlertTriangle size={12} />;
    default: return <Shield size={14} />;
  }
}

// ─── Custom Tooltip ──────────────────────────────────────────────────
function TacoTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: TacoDataPoint }>; label?: string }) {
  if (!active || !payload || !payload[0]) return null;

  const dp = payload[0].payload;
  const sigma = dp.peakStress;
  const color = getStressColor(sigma);
  const regime =
    sigma >= 3.4 ? 'PIVOT IMMINENT' :
    sigma >= 2.9 ? 'PIVOT LIKELY' :
    sigma >= 2.3 ? 'PIVOT WATCH' : 'NO PIVOT';

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${color}`,
        borderRadius: '10px',
        padding: '12px 16px',
        backdropFilter: 'blur(12px)',
        boxShadow: `0 4px 20px ${getStressGlow(sigma)}`,
        minWidth: '190px',
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
          {sigma.toFixed(2)}σ
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
          {regime}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '9px' }}>
        {[
          { label: 'S&P 500', value: dp.zEquity },
          { label: '10Y Yield', value: dp.zRates },
          { label: 'Brent', value: dp.zEnergy },
          { label: 'VIX', value: dp.zVolatility },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
            <span
              style={{
                fontWeight: 700,
                fontFamily: 'monospace',
                color: Math.abs(item.value) >= 2.3 ? '#ff6d00' : Math.abs(item.value) >= 1.5 ? '#ffab00' : 'var(--text-secondary)',
              }}
            >
              {item.value > 0 ? '+' : ''}{item.value.toFixed(2)}σ
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Component Stress Bar ────────────────────────────────────────────
function StressBar({ label, value, icon }: { label: string; value: number; icon: string }) {
  // Map σ value to bar width (0-5σ range → 0-100%)
  const barWidth = Math.min((Math.abs(value) / 4) * 100, 100);
  const isAlert = Math.abs(value) >= 2.3;
  const isWarning = Math.abs(value) >= 1.5;
  const color = isAlert ? '#ff6d00' : isWarning ? '#ffab00' : 'var(--color-gain-bright)';

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
            left: 0,
            width: `${barWidth}%`,
            height: '100%',
            background: isAlert
              ? 'linear-gradient(90deg, #ff6d00, #ff1744)'
              : isWarning
                ? 'linear-gradient(90deg, #ffab00, #ff6d00)'
                : 'linear-gradient(90deg, #00e676, #00c3ff)',
            borderRadius: '3px',
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isAlert ? '0 0 8px rgba(255, 109, 0, 0.5)' : 'none',
          }}
        />
        {/* Threshold markers at 2.3σ and 2.9σ */}
        <div
          style={{
            position: 'absolute',
            left: `${(2.3 / 4) * 100}%`,
            top: 0,
            width: '1px',
            height: '100%',
            background: '#ffab0060',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${(2.9 / 4) * 100}%`,
            top: 0,
            width: '1px',
            height: '100%',
            background: '#ff6d0060',
          }}
        />
      </div>
      <span
        style={{
          width: '50px',
          textAlign: 'right',
          fontWeight: 800,
          fontFamily: 'monospace',
          fontSize: '10px',
          color,
        }}
      >
        {value > 0 ? '+' : ''}{value.toFixed(2)}σ
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function TacoIndexChart() {
  const [data, setData] = useState<TacoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('60d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      const response = await fetch('/api/taco-index');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: TacoResponse = await response.json();
      if (result.data && result.data.length > 0) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch TACO index data:', err);
      setError('Unable to load TACO data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Filter data based on timeframe
  const filteredData = useMemo(() => {
    if (!data) return [];
    const days = timeframe === '30d' ? 30 : timeframe === '60d' ? 60 : 90;
    return data.data.slice(-days);
  }, [data, timeframe]);

  // Current values
  const currentStress = data?.current?.peakStress ?? 0;
  const currentRegime = data?.current?.regime ?? 'NO PIVOT';
  const currentColor = getStressColor(currentStress);
  const currentGlow = getStressGlow(currentStress);

  // Chart gradient IDs
  const gradientId = 'tacoStressGradient';
  const glowGradientId = 'tacoStressGlow';

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
        <span style={{ fontSize: '28px' }}>🌮</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '1px' }}>
          COMPUTING TACO INDEX...
        </span>
        <div style={{ height: '3px', width: '120px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
          <div
            style={{
              width: '50%',
              height: '100%',
              background: '#ff6d00',
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
            color: '#ff6d00',
            background: 'transparent',
            border: '1px solid #ff6d00',
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
        className="taco-index-header"
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
              <span style={{ fontSize: '16px' }}>🌮</span>
              TACO INDEX
            </h2>
            <p style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
              Signum Pivot Model • {timeframe === '30d' ? '30 Day' : timeframe === '60d' ? '60 Day' : '90 Day'} View
            </p>
          </div>

          {/* Live stress badge */}
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
                animation: currentStress >= 2.3 ? 'pulse-dot 1s ease-in-out infinite' : 'pulse-dot 2s ease-in-out infinite',
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
              {currentStress.toFixed(2)}σ
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
                {getRegimeLabel(currentRegime)}
              </span>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                {getRegimeIcon(currentRegime)}
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
        className="taco-index-body"
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
            <AreaChart data={filteredData} margin={{ top: 5, right: 4, left: -10, bottom: 0 }}>
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
                domain={[0, 5]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 600 }}
                ticks={[0, 1, 2, 2.3, 2.9, 3.4, 5]}
                tickFormatter={(v: number) => `${v}σ`}
              />

              {/* Pivot Watch threshold */}
              <ReferenceLine
                y={2.3}
                stroke="#ffab00"
                strokeDasharray="6 4"
                strokeOpacity={0.6}
                strokeWidth={1}
                label={{ value: 'WATCH 2.3σ', position: 'right', fill: '#ffab00', fontSize: 8, fontWeight: 700 }}
              />

              {/* Pivot Likely threshold */}
              <ReferenceLine
                y={2.9}
                stroke="#ff6d00"
                strokeDasharray="6 4"
                strokeOpacity={0.6}
                strokeWidth={1}
                label={{ value: 'LIKELY 2.9σ', position: 'right', fill: '#ff6d00', fontSize: 8, fontWeight: 700 }}
              />

              {/* Pivot Imminent threshold */}
              <ReferenceLine
                y={3.4}
                stroke="#ff1744"
                strokeDasharray="6 4"
                strokeOpacity={0.6}
                strokeWidth={1}
                label={{ value: 'IMMINENT 3.4σ', position: 'right', fill: '#ff1744', fontSize: 8, fontWeight: 700 }}
              />

              <Tooltip content={<TacoTooltip />} />

              <Area
                type="monotone"
                dataKey="peakStress"
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
            className="taco-index-sidebar"
            style={{
              width: '200px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {/* Stress gauge */}
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
                STRESS GAUGE
              </span>

              {/* Horizontal stress bar */}
              <div style={{ position: 'relative', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, #00e676 0%, #00c3ff 30%, #ffab00 55%, #ff6d00 75%, #ff1744 100%)',
                    borderRadius: '4px',
                    opacity: 0.4,
                  }}
                />
                {/* Threshold markers */}
                <div style={{ position: 'absolute', left: `${(2.3 / 5) * 100}%`, top: 0, width: '1px', height: '100%', background: '#ffab0080' }} />
                <div style={{ position: 'absolute', left: `${(2.9 / 5) * 100}%`, top: 0, width: '1px', height: '100%', background: '#ff6d0080' }} />
                <div style={{ position: 'absolute', left: `${(3.4 / 5) * 100}%`, top: 0, width: '1px', height: '100%', background: '#ff174480' }} />
                {/* Position indicator */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    left: `${Math.min((currentStress / 5) * 100, 100)}%`,
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
                <span>CALM</span>
                <span>EXTREME</span>
              </div>

              {/* Dominant stressor callout */}
              {data.current.dominantStressor && (
                <div
                  style={{
                    fontSize: '8px',
                    fontWeight: 700,
                    color: currentColor,
                    background: `${currentColor}10`,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    textAlign: 'center',
                    letterSpacing: '0.3px',
                  }}
                >
                  ⚡ Top Stressor: {data.current.dominantStressor}
                </div>
              )}
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
                STRESS COMPONENTS
              </span>

              <StressBar label="S&P 500" value={data.current.zEquity} icon="📉" />
              <StressBar label="10Y Yld" value={data.current.zRates} icon="🏦" />
              <StressBar label="Brent" value={data.current.zEnergy} icon="🛢️" />
              <StressBar label="VIX" value={data.current.zVolatility} icon="😰" />

              {/* Signum model reference */}
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
                Peak σ = max(|z₁|, ..., |z₄|)
                <br />
                Pivot zone: 2.3 – 3.4σ
                <br />
                <span style={{ color: 'var(--text-muted)', opacity: 0.7 }}>Signum Global Advisors model</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
