"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { RefreshCw } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────
interface BusinessInvestmentDataPoint {
  date: string;
  caGFCF: number;
  usGFCF: number;
  caEmployment: number;
  caGFCFPerWorker: number;
  gap: number;
}

interface BusinessInvestmentResponse {
  data: BusinessInvestmentDataPoint[];
  current: {
    caGFCF: number;
    usGFCF: number;
    caGFCFPerWorker: number;
    gap: number;
    caGrowthYoY: number;
    usGrowthYoY: number;
  };
  lastUpdate: number;
}

type ChartTab = 'caGrowth' | 'perWorker' | 'gap';
type Timeframe = '5y' | '10y' | '20y';

// ─── Colors ──────────────────────────────────────────────────────────
const CA_COLOR = '#ef4444';       // Red for Canada
const US_COLOR = '#3b82f6';       // Blue for US
const PER_WORKER_COLOR = '#8b5cf6'; // Purple for per-worker
const GAP_COLOR = '#f59e0b';      // Amber for gap area
const POSITIVE_COLOR = '#10b981';
const NEGATIVE_COLOR = '#ef4444';

// ─── Helpers ─────────────────────────────────────────────────────────
function formatQuarter(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const month = d.getMonth();
  const q = Math.floor(month / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

function formatGrowth(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

// ─── Custom Tooltips ─────────────────────────────────────────────────
function CAGrowthTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: BusinessInvestmentDataPoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const dp = payload[0].payload;

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '12px 16px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        minWidth: '180px',
      }}
    >
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px' }}>
        {formatQuarter(dp.date)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: CA_COLOR, display: 'inline-block' }} />
        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-primary)' }}>🇨🇦 Canada GFCF</span>
        <span
          style={{
            fontSize: '14px',
            fontWeight: 900,
            fontFamily: 'monospace',
            color: 'var(--text-primary)',
            marginLeft: 'auto',
          }}
        >
          {dp.caGFCF.toFixed(1)}
        </span>
      </div>
      <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>
        Index (2015 = 100)
      </div>
    </div>
  );
}

function PerWorkerTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: BusinessInvestmentDataPoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const dp = payload[0].payload;

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '12px 16px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        minWidth: '200px',
      }}
    >
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px' }}>
        {formatQuarter(dp.date)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: PER_WORKER_COLOR, display: 'inline-block' }} />
        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-primary)' }}>GFCF per Worker</span>
        <span
          style={{
            fontSize: '14px',
            fontWeight: 900,
            fontFamily: 'monospace',
            color: 'var(--text-primary)',
            marginLeft: 'auto',
          }}
        >
          {dp.caGFCFPerWorker.toFixed(1)}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '6px' }}>
        <span>GFCF: {dp.caGFCF.toFixed(1)}</span>
        <span>Workers: {(dp.caEmployment / 1000).toFixed(1)}M</span>
      </div>
    </div>
  );
}

function GapTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: BusinessInvestmentDataPoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const dp = payload[0].payload;

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '12px 16px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        minWidth: '220px',
      }}
    >
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px' }}>
        {formatQuarter(dp.date)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: US_COLOR, display: 'inline-block' }} />
        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-primary)' }}>🇺🇸 US</span>
        <span style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'monospace', color: 'var(--text-primary)', marginLeft: 'auto' }}>
          {dp.usGFCF.toFixed(1)}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: CA_COLOR, display: 'inline-block' }} />
        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-primary)' }}>🇨🇦 Canada</span>
        <span style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'monospace', color: 'var(--text-primary)', marginLeft: 'auto' }}>
          {dp.caGFCF.toFixed(1)}
        </span>
      </div>
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Gap (US − CA)</span>
        <span
          style={{
            fontWeight: 800,
            fontFamily: 'monospace',
            color: dp.gap >= 0 ? US_COLOR : CA_COLOR,
          }}
        >
          {dp.gap >= 0 ? '+' : ''}{dp.gap.toFixed(1)} pts
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function BusinessInvestmentChart() {
  const [data, setData] = useState<BusinessInvestmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ChartTab>('caGrowth');
  const [timeframe, setTimeframe] = useState<Timeframe>('10y');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      const response = await fetch('/api/business-investment');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: BusinessInvestmentResponse = await response.json();
      if (result.data && result.data.length > 0) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch business investment data:', err);
      setError('Unable to load business investment data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh every 6 hours (quarterly data doesn't change often)
    const interval = setInterval(() => fetchData(), 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Filter data by timeframe
  const filteredData = useMemo(() => {
    if (!data) return [];
    const quarters = timeframe === '5y' ? 20 : timeframe === '10y' ? 40 : 80;
    return data.data.slice(-quarters);
  }, [data, timeframe]);

  // Dynamic Y-axis domains
  const caGrowthDomain = useMemo(() => {
    if (filteredData.length === 0) return [80, 120];
    const vals = filteredData.map((d) => d.caGFCF);
    const min = Math.floor(Math.min(...vals) - 3);
    const max = Math.ceil(Math.max(...vals) + 3);
    return [min, max];
  }, [filteredData]);

  const perWorkerDomain = useMemo(() => {
    if (filteredData.length === 0) return [80, 120];
    const vals = filteredData.map((d) => d.caGFCFPerWorker);
    const min = Math.floor(Math.min(...vals) - 3);
    const max = Math.ceil(Math.max(...vals) + 3);
    return [min, max];
  }, [filteredData]);

  const gapDomain = useMemo(() => {
    if (filteredData.length === 0) return [70, 130];
    const allVals = filteredData.flatMap((d) => [d.caGFCF, d.usGFCF]);
    const min = Math.floor(Math.min(...allVals) - 3);
    const max = Math.ceil(Math.max(...allVals) + 3);
    return [min, max];
  }, [filteredData]);

  // Current values
  const currentCA = data?.current?.caGFCF ?? 0;
  const currentUS = data?.current?.usGFCF ?? 0;
  const currentPerWorker = data?.current?.caGFCFPerWorker ?? 0;
  const currentGap = data?.current?.gap ?? 0;
  const caYoY = data?.current?.caGrowthYoY ?? 0;
  const usYoY = data?.current?.usGrowthYoY ?? 0;

  // Tab configuration
  const tabs: { key: ChartTab; label: string; emoji: string }[] = [
    { key: 'caGrowth', label: 'CA Growth', emoji: '🇨🇦' },
    { key: 'perWorker', label: 'Per Worker', emoji: '👷' },
    { key: 'gap', label: 'CA vs US', emoji: '📊' },
  ];

  // Gradient IDs
  const caGradientId = 'bizInvCAGradient';
  const usGradientId = 'bizInvUSGradient';
  const pwGradientId = 'bizInvPWGradient';
  const gapGradientId = 'bizInvGapGradient';

  // ─── Loading ───────────────────────────────────────────────────────
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
        <span style={{ fontSize: '28px' }}>🏗️</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '1px' }}>
          LOADING BUSINESS INVESTMENT DATA...
        </span>
        <div style={{ height: '3px', width: '120px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
          <div
            style={{
              width: '50%',
              height: '100%',
              background: CA_COLOR,
              position: 'absolute',
              animation: 'indeterminate-slide 1.5s infinite ease-in-out',
            }}
          />
        </div>
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────
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
            color: CA_COLOR,
            background: 'transparent',
            border: `1px solid ${CA_COLOR}`,
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

  // ─── Main Render ───────────────────────────────────────────────────
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
        minHeight: '380px',
      }}
    >
      {/* ─── Header ───────────────────────────────────────────────── */}
      <div
        className="business-investment-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        {/* Title + Badges */}
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
              <span style={{ fontSize: '16px' }}>🏗️</span>
              BUSINESS INVESTMENT
            </h2>
            <p style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
              Gross Fixed Capital Formation (Quarterly) •{' '}
              {timeframe === '5y' ? '5 Year' : timeframe === '10y' ? '10 Year' : '20 Year'} View
            </p>
          </div>

          {/* CA GFCF Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: `${CA_COLOR}12`,
              border: `1px solid ${CA_COLOR}40`,
              borderRadius: '10px',
              padding: '6px 14px',
              boxShadow: `0 0 20px ${CA_COLOR}30`,
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
                🇨🇦 CA GFCF
              </span>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.5px',
                }}
              >
                {currentCA.toFixed(1)}
              </span>
            </div>
          </div>

          {/* US GFCF Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: `${US_COLOR}12`,
              border: `1px solid ${US_COLOR}40`,
              borderRadius: '10px',
              padding: '6px 14px',
              boxShadow: `0 0 20px ${US_COLOR}30`,
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
                🇺🇸 US GFCF
              </span>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.5px',
                }}
              >
                {currentUS.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Controls: Tabs + Timeframe + Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Chart tabs */}
          <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-panel)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  background: activeTab === tab.key ? 'var(--color-accent)' : 'transparent',
                  border: 'none',
                  color: activeTab === tab.key ? 'var(--color-bg-deep)' : 'var(--text-muted)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.emoji} {tab.label}
              </button>
            ))}
          </div>

          {/* Timeframe selector */}
          <div style={{ display: 'flex', gap: '3px' }}>
            {(['5y', '10y', '20y'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  background: timeframe === tf ? `${CA_COLOR}18` : 'transparent',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${timeframe === tf ? CA_COLOR : 'var(--border-color)'}`,
                  fontSize: '10px',
                  fontWeight: 800,
                  color: timeframe === tf ? CA_COLOR : 'var(--text-muted)',
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

      {/* ─── Chart + Sidebar ──────────────────────────────────────── */}
      <div
        className="business-investment-body"
        style={{
          flex: 1,
          display: 'flex',
          gap: '14px',
          minHeight: '220px',
        }}
      >
        {/* Chart Area */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <ResponsiveContainer width="100%" height="100%" minHeight={220}>
            {activeTab === 'gap' ? (
              /* ─── CA vs US Gap (AreaChart with two lines) ──────── */
              <AreaChart data={filteredData} margin={{ top: 5, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id={usGradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={US_COLOR} stopOpacity={0.20} />
                    <stop offset="100%" stopColor={US_COLOR} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id={caGradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CA_COLOR} stopOpacity={0.20} />
                    <stop offset="100%" stopColor={CA_COLOR} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" horizontal vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 600 }}
                  minTickGap={60}
                  tickFormatter={formatQuarter}
                />
                <YAxis
                  domain={gapDomain}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 600 }}
                />
                <ReferenceLine
                  y={100}
                  stroke="var(--text-muted)"
                  strokeDasharray="8 4"
                  strokeOpacity={0.5}
                  strokeWidth={1.5}
                  label={{
                    value: '2015 BASE',
                    position: 'right',
                    fill: 'var(--text-muted)',
                    fontSize: 8,
                    fontWeight: 700,
                  }}
                />
                <Tooltip content={<GapTooltip />} />
                <Area
                  type="monotone"
                  dataKey="usGFCF"
                  stroke={US_COLOR}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={`url(#${usGradientId})`}
                  animationDuration={1500}
                  animationEasing="ease-out"
                  dot={false}
                  activeDot={{ r: 5, stroke: US_COLOR, strokeWidth: 2, fill: 'var(--bg-surface)' }}
                  name="US GFCF"
                />
                <Area
                  type="monotone"
                  dataKey="caGFCF"
                  stroke={CA_COLOR}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={`url(#${caGradientId})`}
                  animationDuration={1500}
                  animationEasing="ease-out"
                  dot={false}
                  activeDot={{ r: 5, stroke: CA_COLOR, strokeWidth: 2, fill: 'var(--bg-surface)' }}
                  name="CA GFCF"
                />
              </AreaChart>
            ) : activeTab === 'perWorker' ? (
              /* ─── Per Worker (LineChart) ────────────────────────── */
              <AreaChart data={filteredData} margin={{ top: 5, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id={pwGradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PER_WORKER_COLOR} stopOpacity={0.25} />
                    <stop offset="50%" stopColor={PER_WORKER_COLOR} stopOpacity={0.08} />
                    <stop offset="100%" stopColor={PER_WORKER_COLOR} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" horizontal vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 600 }}
                  minTickGap={60}
                  tickFormatter={formatQuarter}
                />
                <YAxis
                  domain={perWorkerDomain}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 600 }}
                />
                <ReferenceLine
                  y={100}
                  stroke="var(--text-muted)"
                  strokeDasharray="8 4"
                  strokeOpacity={0.5}
                  strokeWidth={1.5}
                  label={{
                    value: 'BASE',
                    position: 'right',
                    fill: 'var(--text-muted)',
                    fontSize: 8,
                    fontWeight: 700,
                  }}
                />
                <Tooltip content={<PerWorkerTooltip />} />
                <Area
                  type="monotone"
                  dataKey="caGFCFPerWorker"
                  stroke={PER_WORKER_COLOR}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={`url(#${pwGradientId})`}
                  animationDuration={1500}
                  animationEasing="ease-out"
                  dot={false}
                  activeDot={{ r: 5, stroke: PER_WORKER_COLOR, strokeWidth: 2, fill: 'var(--bg-surface)' }}
                  name="GFCF/Worker"
                />
              </AreaChart>
            ) : (
              /* ─── CA Growth (AreaChart) ──────────────────────────── */
              <AreaChart data={filteredData} margin={{ top: 5, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id={gapGradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CA_COLOR} stopOpacity={0.25} />
                    <stop offset="50%" stopColor={CA_COLOR} stopOpacity={0.08} />
                    <stop offset="100%" stopColor={CA_COLOR} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" horizontal vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 600 }}
                  minTickGap={60}
                  tickFormatter={formatQuarter}
                />
                <YAxis
                  domain={caGrowthDomain}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 600 }}
                />
                <ReferenceLine
                  y={100}
                  stroke="var(--text-muted)"
                  strokeDasharray="8 4"
                  strokeOpacity={0.5}
                  strokeWidth={1.5}
                  label={{
                    value: '2015 BASE',
                    position: 'right',
                    fill: 'var(--text-muted)',
                    fontSize: 8,
                    fontWeight: 700,
                  }}
                />
                <Tooltip content={<CAGrowthTooltip />} />
                <Area
                  type="monotone"
                  dataKey="caGFCF"
                  stroke={CA_COLOR}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={`url(#${gapGradientId})`}
                  animationDuration={1500}
                  animationEasing="ease-out"
                  dot={false}
                  activeDot={{ r: 5, stroke: CA_COLOR, strokeWidth: 2, fill: 'var(--bg-surface)' }}
                  name="CA GFCF"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '4px' }}>
            {activeTab === 'gap' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  <span style={{ width: '12px', height: '3px', borderRadius: '2px', background: US_COLOR, display: 'inline-block' }} />
                  🇺🇸 US GFCF Index
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  <span style={{ width: '12px', height: '3px', borderRadius: '2px', background: CA_COLOR, display: 'inline-block' }} />
                  🇨🇦 Canada GFCF Index
                </div>
              </>
            ) : activeTab === 'perWorker' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                <span style={{ width: '12px', height: '3px', borderRadius: '2px', background: PER_WORKER_COLOR, display: 'inline-block' }} />
                🇨🇦 Canada GFCF per Worker (Indexed)
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                <span style={{ width: '12px', height: '3px', borderRadius: '2px', background: CA_COLOR, display: 'inline-block' }} />
                🇨🇦 Canada GFCF Index (2015 = 100)
              </div>
            )}
          </div>
        </div>

        {/* ─── Sidebar Stats ──────────────────────────────────────── */}
        {data?.current && (
          <div
            className="business-investment-sidebar"
            style={{
              width: '180px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {/* CA YoY Growth */}
            <div
              style={{
                padding: '10px 12px',
                background: 'var(--bg-panel)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontSize: '8px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '4px' }}>
                🇨🇦 CA YoY GROWTH
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: caYoY >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR,
                }}
              >
                {formatGrowth(caYoY)}
              </div>
            </div>

            {/* US YoY Growth */}
            <div
              style={{
                padding: '10px 12px',
                background: 'var(--bg-panel)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontSize: '8px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '4px' }}>
                🇺🇸 US YoY GROWTH
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: usYoY >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR,
                }}
              >
                {formatGrowth(usYoY)}
              </div>
            </div>

            {/* Gap */}
            <div
              style={{
                padding: '10px 12px',
                background: 'var(--bg-panel)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontSize: '8px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '4px' }}>
                US − CA GAP
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: currentGap >= 0 ? US_COLOR : CA_COLOR,
                }}
              >
                {currentGap >= 0 ? '+' : ''}{currentGap.toFixed(1)}
              </div>
              <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                index points
              </div>
            </div>

            {/* Per Worker */}
            <div
              style={{
                padding: '10px 12px',
                background: 'var(--bg-panel)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontSize: '8px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '4px' }}>
                🇨🇦 GFCF / WORKER
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: PER_WORKER_COLOR,
                }}
              >
                {currentPerWorker.toFixed(1)}
              </div>
              <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                indexed (base = 100)
              </div>
            </div>

            {/* Data Source */}
            <div
              style={{
                padding: '8px 10px',
                fontSize: '8px',
                color: 'var(--text-muted)',
                fontWeight: 600,
                lineHeight: '1.5',
                borderTop: '1px solid var(--border-color)',
                marginTop: 'auto',
              }}
            >
              Source: OECD via FRED
              <br />
              GFCF Index (2015=100)
              <br />
              Quarterly, Seasonally Adj.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
