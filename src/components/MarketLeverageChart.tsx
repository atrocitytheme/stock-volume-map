"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { RefreshCw, Activity, DollarSign } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────
interface LeverageDataPoint {
  date: string;
  nfciLeverage: number | null;
  marginDebt: number | null;
}

interface LeverageResponse {
  data: LeverageDataPoint[];
  current: {
    nfciLeverage: number | null;
    marginDebt: number | null;
  };
  lastUpdate: number;
}

type Timeframe = '1y' | '3y' | '5y';

// ─── Color helpers ───────────────────────────────────────────────────
const NFCI_COLOR = '#8b5cf6'; // Violet
const MARGIN_COLOR = '#10b981'; // Emerald Green
const NFCI_GLOW = 'rgba(139, 92, 246, 0.4)';
const MARGIN_GLOW = 'rgba(16, 185, 129, 0.4)';

// ─── Custom Tooltip ──────────────────────────────────────────────────
function LeverageTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: LeverageDataPoint; dataKey: string }>;
  label?: string;
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
        boxShadow: `0 4px 20px rgba(0,0,0,0.2)`,
        minWidth: '220px',
      }}
    >
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px' }}>
        {label}
      </div>

      {dp.nfciLeverage !== null && (
        <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: NFCI_COLOR, display: 'inline-block' }} />
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-primary)' }}>NFCI Leverage</span>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 900,
                fontFamily: 'monospace',
                color: NFCI_COLOR,
                marginLeft: 'auto',
              }}
            >
              {dp.nfciLeverage.toFixed(2)}
            </span>
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
            Financial Conditions Subindex
          </div>
        </div>
      )}

      {dp.marginDebt !== null && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: MARGIN_COLOR, display: 'inline-block' }} />
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-primary)' }}>Margin Debt</span>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 900,
                fontFamily: 'monospace',
                color: MARGIN_COLOR,
                marginLeft: 'auto',
              }}
            >
              ${dp.marginDebt.toFixed(2)}B
            </span>
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
            Broker/Dealer Receivables
            <br />
            <span style={{ fontSize: '8px', opacity: 0.8 }}>*Official data is collected quarterly</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Custom Legend ───────────────────────────────────────────────────
function ChartLegend() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)' }}>
        <span style={{ width: '12px', height: '3px', borderRadius: '2px', background: NFCI_COLOR, display: 'inline-block' }} />
        NFCI Leverage (Weekly)
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)' }}>
        <span style={{ width: '12px', height: '3px', borderRadius: '2px', background: MARGIN_COLOR, display: 'inline-block' }} />
        Margin Debt (Interpolated between quarterly data)
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function MarketLeverageChart() {
  const [data, setData] = useState<LeverageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('5y');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      const response = await fetch('/api/market-leverage');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: LeverageResponse = await response.json();
      if (result.data && result.data.length > 0) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch market leverage data:', err);
      setError('Unable to load leverage data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 60 * 60 * 1000); // 1 hour update, these are slow series
    return () => clearInterval(interval);
  }, [fetchData]);

  // Filter data based on timeframe
  const filteredData = useMemo(() => {
    if (!data) return [];
    const days = timeframe === '1y' ? 365 : timeframe === '3y' ? 3 * 365 : 5 * 365;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return data.data.filter(d => new Date(d.date) >= cutoff);
  }, [data, timeframe]);

  // Current values
  const currentNfci = data?.current?.nfciLeverage ?? 0;
  const currentMargin = data?.current?.marginDebt ?? 0;

  // Chart gradient IDs
  const nfciGradientId = 'nfciLeverageGradient';

  // Compute domains
  const nfciDomain = useMemo(() => {
    if (filteredData.length === 0) return [-2, 2];
    const vals = filteredData.map(d => d.nfciLeverage).filter(v => v !== null) as number[];
    if (vals.length === 0) return [-2, 2];
    let min = Math.min(...vals);
    let max = Math.max(...vals);
    return [Math.floor((min - 0.2) * 2) / 2, Math.ceil((max + 0.2) * 2) / 2];
  }, [filteredData]);

  const marginDomain = useMemo(() => {
    if (filteredData.length === 0) return [0, 1000];
    const vals = filteredData.map(d => d.marginDebt).filter(v => v !== null) as number[];
    if (vals.length === 0) return [0, 1000];
    let min = Math.min(...vals);
    let max = Math.max(...vals);
    return [Math.floor((min - 100) / 100) * 100, Math.ceil((max + 100) / 100) * 100];
  }, [filteredData]);

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
        <span style={{ fontSize: '28px' }}>⚖️</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '1px' }}>
          COMPUTING LEVERAGE LEVELS...
        </span>
        <div style={{ height: '3px', width: '120px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
          <div
            style={{
              width: '50%',
              height: '100%',
              background: NFCI_COLOR,
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
            color: NFCI_COLOR,
            background: 'transparent',
            border: `1px solid ${NFCI_COLOR}`,
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
        className="leverage-header"
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
              <span style={{ fontSize: '16px' }}>⚖️</span>
              MARKET LEVERAGE
            </h2>
            <p style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
              Systemic Risk • {timeframe === '1y' ? '1 Year' : timeframe === '3y' ? '3 Year' : '5 Year'} View
            </p>
          </div>

          {/* NFCI Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: `${NFCI_COLOR}12`,
              border: `1px solid ${NFCI_COLOR}40`,
              borderRadius: '10px',
              padding: '6px 14px',
              boxShadow: `0 0 20px ${NFCI_GLOW}`,
              transition: 'all 0.6s ease',
            }}
          >
            <Activity size={14} color={NFCI_COLOR} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '8px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                NFCI LEV
              </span>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: NFCI_COLOR,
                  letterSpacing: '-0.5px',
                }}
              >
                {currentNfci.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Margin Debt Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: `${MARGIN_COLOR}12`,
              border: `1px solid ${MARGIN_COLOR}40`,
              borderRadius: '10px',
              padding: '6px 14px',
              boxShadow: `0 0 20px ${MARGIN_GLOW}`,
              transition: 'all 0.6s ease',
            }}
          >
            <DollarSign size={14} color={MARGIN_COLOR} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '8px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                MARGIN DEBT
              </span>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: MARGIN_COLOR,
                  letterSpacing: '-0.5px',
                }}
              >
                ${currentMargin.toFixed(1)}B
              </span>
            </div>
          </div>
        </div>

        {/* Controls: Timeframe + Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '3px' }}>
            {(['1y', '3y', '5y'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  background: timeframe === tf ? `${NFCI_COLOR}18` : 'transparent',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${timeframe === tf ? NFCI_COLOR : 'var(--border-color)'}`,
                  fontSize: '10px',
                  fontWeight: 800,
                  color: timeframe === tf ? NFCI_COLOR : 'var(--text-muted)',
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

      {/* ─── Chart Area ─────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px', minHeight: '200px' }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
          <ComposedChart data={filteredData} margin={{ top: 5, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id={nfciGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={NFCI_COLOR} stopOpacity={0.35} />
                <stop offset="50%" stopColor={NFCI_COLOR} stopOpacity={0.10} />
                <stop offset="100%" stopColor={NFCI_COLOR} stopOpacity={0.01} />
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
                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              }}
            />

            {/* Left Y Axis for NFCI */}
            <YAxis
              yAxisId="left"
              domain={nfciDomain}
              axisLine={false}
              tickLine={false}
              tick={{ fill: NFCI_COLOR, fontSize: 9, fontWeight: 600 }}
              tickFormatter={(v: number) => v.toFixed(1)}
              width={35}
            />

            {/* Right Y Axis for Margin Debt */}
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={marginDomain}
              axisLine={false}
              tickLine={false}
              tick={{ fill: MARGIN_COLOR, fontSize: 9, fontWeight: 600 }}
              tickFormatter={(v: number) => `$${Math.round(v)}B`}
              width={45}
            />

            <ReferenceLine
              y={0}
              yAxisId="left"
              stroke="var(--text-muted)"
              strokeDasharray="8 4"
              strokeOpacity={0.5}
              strokeWidth={1.5}
            />

            <Tooltip content={<LeverageTooltip />} />

            {/* NFCI Leverage Area */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="nfciLeverage"
              stroke={NFCI_COLOR}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#${nfciGradientId})`}
              animationDuration={1500}
              animationEasing="ease-out"
              dot={false}
              activeDot={{ r: 5, stroke: NFCI_COLOR, strokeWidth: 2, fill: 'var(--bg-surface)' }}
              connectNulls
            />

            {/* Margin Debt Line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="marginDebt"
              stroke={MARGIN_COLOR}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, stroke: MARGIN_COLOR, strokeWidth: 2, fill: 'var(--bg-surface)' }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
        
        <ChartLegend />
      </div>
    </div>
  );
}
