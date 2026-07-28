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
  Legend,
} from 'recharts';
import { RefreshCw } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────
interface RealYieldDataPoint {
  date: string;
  usRealYield: number;
  caRealYield: number;
  usNominal: number;
  caNominal: number;
  usBreakeven: number;
  caBreakeven: number;
}

interface RealYieldResponse {
  data: RealYieldDataPoint[];
  current: {
    usRealYield: number;
    caRealYield: number;
    usNominal: number;
    caNominal: number;
    usBreakeven: number;
    caBreakeven: number;
    spread: number;
  };
  lastUpdate: number;
}

type Timeframe = '30d' | '60d' | '90d';

// ─── Color constants ─────────────────────────────────────────────────
const US_COLOR = '#3b82f6';      // Blue
const CA_COLOR = '#f59e0b';      // Amber
const US_GLOW = 'rgba(59, 130, 246, 0.3)';
const CA_GLOW = 'rgba(245, 158, 11, 0.3)';
const POSITIVE_COLOR = '#10b981'; // Green — positive real yield
const NEGATIVE_COLOR = '#ef4444'; // Red — negative real yield

// ─── Helpers ─────────────────────────────────────────────────────────
function getYieldColor(value: number): string {
  return value >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR;
}

function formatYield(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

// ─── Custom Tooltip ──────────────────────────────────────────────────
function RealYieldTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: RealYieldDataPoint; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const dp = payload[0].payload;
  const spread = dp.usRealYield - dp.caRealYield;

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '12px 16px',
        backdropFilter: 'blur(12px)',
        boxShadow: `0 4px 20px rgba(0,0,0,0.2)`,
        minWidth: '220px',
      }}
    >
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px' }}>
        {label}
      </div>

      {/* US Section */}
      <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: US_COLOR, display: 'inline-block' }} />
          <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-primary)' }}>US 10Y</span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 900,
              fontFamily: 'monospace',
              color: getYieldColor(dp.usRealYield),
              marginLeft: 'auto',
            }}
          >
            {formatYield(dp.usRealYield)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)' }}>
          <span>Nominal: {dp.usNominal.toFixed(2)}%</span>
          <span>BE: {dp.usBreakeven.toFixed(2)}%</span>
        </div>
      </div>

      {/* CA Section */}
      <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: CA_COLOR, display: 'inline-block' }} />
          <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-primary)' }}>CA 10Y</span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 900,
              fontFamily: 'monospace',
              color: getYieldColor(dp.caRealYield),
              marginLeft: 'auto',
            }}
          >
            {formatYield(dp.caRealYield)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)' }}>
          <span>Nominal: {dp.caNominal.toFixed(2)}%</span>
          <span>BE: {dp.caBreakeven.toFixed(2)}%</span>
        </div>
      </div>

      {/* Spread */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>US − CA Spread</span>
        <span
          style={{
            fontWeight: 800,
            fontFamily: 'monospace',
            color: spread >= 0 ? US_COLOR : CA_COLOR,
          }}
        >
          {spread >= 0 ? '+' : ''}{spread.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

// ─── Yield Breakdown Bar ─────────────────────────────────────────────
function YieldBar({
  label,
  nominal,
  breakeven,
  real,
  accentColor,
}: {
  label: string;
  nominal: number;
  breakeven: number;
  real: number;
  accentColor: string;
}) {
  // Map real yield to bar position (range: -2% to +4%)
  const range = 6; // total range in %
  const offset = 2; // shift so -2% maps to 0
  const barPercent = Math.max(0, Math.min(100, ((real + offset) / range) * 100));
  const zeroPercent = (offset / range) * 100; // where 0% falls

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '9px', fontWeight: 800, color: accentColor, letterSpacing: '0.5px' }}>
          {label}
        </span>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 900,
            fontFamily: 'monospace',
            color: getYieldColor(real),
          }}
        >
          {formatYield(real)}
        </span>
      </div>

      {/* Bar visualization */}
      <div style={{ position: 'relative', height: '6px', background: 'var(--bg-panel)', borderRadius: '3px', overflow: 'hidden' }}>
        {/* Zero line marker */}
        <div
          style={{
            position: 'absolute',
            left: `${zeroPercent}%`,
            top: 0,
            width: '1px',
            height: '100%',
            background: 'var(--text-muted)',
            opacity: 0.4,
            zIndex: 2,
          }}
        />
        {/* Filled bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: real >= 0 ? `${zeroPercent}%` : `${barPercent}%`,
            width: real >= 0 ? `${barPercent - zeroPercent}%` : `${zeroPercent - barPercent}%`,
            height: '100%',
            background: real >= 0
              ? `linear-gradient(90deg, ${accentColor}80, ${accentColor})`
              : `linear-gradient(90deg, ${NEGATIVE_COLOR}, ${NEGATIVE_COLOR}80)`,
            borderRadius: '3px',
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>

      {/* Breakdown: Nominal − Breakeven */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--text-muted)', fontWeight: 600 }}>
        <span>Nom: {nominal.toFixed(2)}%</span>
        <span>BE: {breakeven.toFixed(2)}%</span>
      </div>
    </div>
  );
}

// ─── Custom Legend ───────────────────────────────────────────────────
function ChartLegend() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)' }}>
        <span style={{ width: '12px', height: '3px', borderRadius: '2px', background: US_COLOR, display: 'inline-block' }} />
        US 10Y Real Yield
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)' }}>
        <span style={{ width: '12px', height: '3px', borderRadius: '2px', background: CA_COLOR, display: 'inline-block' }} />
        CA 10Y Real Yield (est.)
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function RealYieldChart() {
  const [data, setData] = useState<RealYieldResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('60d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      const response = await fetch('/api/real-yield');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: RealYieldResponse = await response.json();
      if (result.data && result.data.length > 0) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch real yield data:', err);
      setError('Unable to load real yield data');
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

  // Compute Y-axis domain dynamically
  const yDomain = useMemo(() => {
    if (filteredData.length === 0) return [-1, 3];
    let min = Infinity;
    let max = -Infinity;
    for (const dp of filteredData) {
      min = Math.min(min, dp.usRealYield, dp.caRealYield);
      max = Math.max(max, dp.usRealYield, dp.caRealYield);
    }
    // Add padding and round to nearest 0.5
    min = Math.floor((min - 0.3) * 2) / 2;
    max = Math.ceil((max + 0.3) * 2) / 2;
    return [min, max];
  }, [filteredData]);

  // Current values
  const currentUS = data?.current?.usRealYield ?? 0;
  const currentCA = data?.current?.caRealYield ?? 0;
  const currentSpread = data?.current?.spread ?? 0;

  // Gradient IDs (unique to avoid conflicts with other charts)
  const usGradientId = 'realYieldUSGradient';
  const caGradientId = 'realYieldCAGradient';

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
        <span style={{ fontSize: '28px' }}>📊</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '1px' }}>
          COMPUTING REAL YIELDS...
        </span>
        <div style={{ height: '3px', width: '120px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
          <div
            style={{
              width: '50%',
              height: '100%',
              background: US_COLOR,
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
            color: US_COLOR,
            background: 'transparent',
            border: `1px solid ${US_COLOR}`,
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
        className="real-yield-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        {/* Title + Live Badges */}
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
              <span style={{ fontSize: '16px' }}>📊</span>
              REAL YIELD
            </h2>
            <p style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
              10Y Inflation-Adjusted Yield • {timeframe === '30d' ? '30 Day' : timeframe === '60d' ? '60 Day' : '90 Day'} View
            </p>
          </div>

          {/* US Real Yield badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: `${US_COLOR}12`,
              border: `1px solid ${US_COLOR}40`,
              borderRadius: '10px',
              padding: '6px 14px',
              boxShadow: `0 0 20px ${US_GLOW}`,
              transition: 'all 0.6s ease',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: US_COLOR,
                boxShadow: `0 0 10px ${US_COLOR}`,
                display: 'inline-block',
                animation: 'pulse-dot 2s ease-in-out infinite',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '8px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                🇺🇸 US
              </span>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: getYieldColor(currentUS),
                  letterSpacing: '-0.5px',
                }}
              >
                {formatYield(currentUS)}
              </span>
            </div>
          </div>

          {/* CA Real Yield badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: `${CA_COLOR}12`,
              border: `1px solid ${CA_COLOR}40`,
              borderRadius: '10px',
              padding: '6px 14px',
              boxShadow: `0 0 20px ${CA_GLOW}`,
              transition: 'all 0.6s ease',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: CA_COLOR,
                boxShadow: `0 0 10px ${CA_COLOR}`,
                display: 'inline-block',
                animation: 'pulse-dot 2s ease-in-out infinite',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '8px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                🇨🇦 CA
              </span>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: getYieldColor(currentCA),
                  letterSpacing: '-0.5px',
                }}
              >
                {formatYield(currentCA)}
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
                  background: timeframe === tf ? `${US_COLOR}18` : 'transparent',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${timeframe === tf ? US_COLOR : 'var(--border-color)'}`,
                  fontSize: '10px',
                  fontWeight: 800,
                  color: timeframe === tf ? US_COLOR : 'var(--text-muted)',
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

      {/* ─── Chart + Sidebar Layout ─────────────────────────────────── */}
      <div
        className="real-yield-body"
        style={{
          flex: 1,
          display: 'flex',
          gap: '14px',
          minHeight: '200px',
        }}
      >
        {/* Chart Area */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <AreaChart data={filteredData} margin={{ top: 5, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id={usGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={US_COLOR} stopOpacity={0.30} />
                  <stop offset="50%" stopColor={US_COLOR} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={US_COLOR} stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id={caGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CA_COLOR} stopOpacity={0.25} />
                  <stop offset="50%" stopColor={CA_COLOR} stopOpacity={0.06} />
                  <stop offset="100%" stopColor={CA_COLOR} stopOpacity={0.01} />
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
                domain={yDomain}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 600 }}
                tickFormatter={(v: number) => `${v.toFixed(1)}%`}
              />

              {/* Zero reference line — divides positive/negative real yield territory */}
              <ReferenceLine
                y={0}
                stroke="var(--text-muted)"
                strokeDasharray="8 4"
                strokeOpacity={0.5}
                strokeWidth={1.5}
                label={{
                  value: '0% REAL',
                  position: 'right',
                  fill: 'var(--text-muted)',
                  fontSize: 8,
                  fontWeight: 700,
                }}
              />

              <Tooltip content={<RealYieldTooltip />} />

              {/* US Real Yield Area */}
              <Area
                type="monotone"
                dataKey="usRealYield"
                stroke={US_COLOR}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#${usGradientId})`}
                animationDuration={1500}
                animationEasing="ease-out"
                dot={false}
                activeDot={{
                  r: 5,
                  stroke: US_COLOR,
                  strokeWidth: 2,
                  fill: 'var(--bg-surface)',
                }}
                name="US 10Y"
              />

              {/* CA Real Yield Area */}
              <Area
                type="monotone"
                dataKey="caRealYield"
                stroke={CA_COLOR}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${caGradientId})`}
                animationDuration={1500}
                animationEasing="ease-out"
                dot={false}
                activeDot={{
                  r: 5,
                  stroke: CA_COLOR,
                  strokeWidth: 2,
                  fill: 'var(--bg-surface)',
                }}
                name="CA 10Y"
                strokeDasharray="6 3"
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Custom Legend */}
          <ChartLegend />
        </div>

        {/* ─── Sidebar ───────────────────────────────────────────────── */}
        {data?.current && (
          <div
            className="real-yield-sidebar"
            style={{
              width: '200px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {/* US Yield Breakdown */}
            <div
              style={{
                background: 'var(--bg-panel)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                border: '1px solid var(--border-color)',
              }}
            >
              <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px' }}>
                YIELD BREAKDOWN
              </span>

              <YieldBar
                label="🇺🇸 US 10Y"
                nominal={data.current.usNominal}
                breakeven={data.current.usBreakeven}
                real={data.current.usRealYield}
                accentColor={US_COLOR}
              />

              <div style={{ height: '1px', background: 'var(--border-color)', margin: '2px 0' }} />

              <YieldBar
                label="🇨🇦 CA 10Y"
                nominal={data.current.caNominal}
                breakeven={data.current.caBreakeven}
                real={data.current.caRealYield}
                accentColor={CA_COLOR}
              />
            </div>

            {/* Spread Indicator */}
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
                US − CA SPREAD
              </span>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '20px',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                    color: currentSpread >= 0 ? US_COLOR : CA_COLOR,
                  }}
                >
                  {currentSpread >= 0 ? '+' : ''}{currentSpread.toFixed(2)}%
                </span>
              </div>

              <div
                style={{
                  fontSize: '8px',
                  fontWeight: 700,
                  textAlign: 'center',
                  color: currentSpread >= 0 ? US_COLOR : CA_COLOR,
                  background: `${currentSpread >= 0 ? US_COLOR : CA_COLOR}10`,
                  padding: '3px 6px',
                  borderRadius: '4px',
                }}
              >
                {currentSpread >= 0 ? 'US yields higher' : 'CA yields higher'}
              </div>
            </div>

            {/* Regime Indicator */}
            <div
              style={{
                background: 'var(--bg-panel)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                border: '1px solid var(--border-color)',
                flex: 1,
              }}
            >
              <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px' }}>
                REGIME
              </span>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: getYieldColor(currentUS),
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: getYieldColor(currentUS),
                    boxShadow: `0 0 6px ${getYieldColor(currentUS)}`,
                    display: 'inline-block',
                  }}
                />
                {currentUS > 1.5
                  ? 'RESTRICTIVE'
                  : currentUS > 0
                    ? 'POSITIVE REAL'
                    : currentUS > -0.5
                      ? 'NEAR ZERO'
                      : 'FINANCIAL REPRESSION'}
              </div>

              <div style={{ fontSize: '8px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {currentUS > 1.5
                  ? 'High real yields attract capital; tight monetary conditions'
                  : currentUS > 0
                    ? 'Positive real returns for bond holders; neutral policy stance'
                    : currentUS > -0.5
                      ? 'Real returns near zero; accommodative policy environment'
                      : 'Negative real returns; holders losing purchasing power'}
              </div>

              {/* Methodology note */}
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
                Real = Nominal − Breakeven
                <br />
                BE est. via gold momentum
                <br />
                <span style={{ color: 'var(--text-muted)', opacity: 0.7 }}>CA yields are approximated</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
