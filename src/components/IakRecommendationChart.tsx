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
import { RefreshCw } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────
interface IakDataPoint {
  date: string;
  score: number;
  iakMomentum: number;
  yieldEnv: number;
  volatility: number;
  creditHealth: number;
  marketTrend: number;
  iakPrice: number;
}

interface IakRecommendationResponse {
  data: IakDataPoint[];
  current: {
    score: number;
    recommendation: 'STRONG BUY' | 'BUY' | 'HOLD' | 'REDUCE' | 'SELL';
    iakPrice: number;
    iakChange: number;
    iakMomentum: number;
    yieldEnv: number;
    volatility: number;
    creditHealth: number;
    marketTrend: number;
  };
  lastUpdate: number;
}

type Timeframe = '30d' | '60d' | '90d';

// ─── Color helpers ───────────────────────────────────────────────────
function getScoreColor(score: number): string {
  if (score >= 75) return '#00e676';
  if (score >= 60) return '#10b981';
  if (score >= 45) return '#f59e0b';
  if (score >= 30) return '#ff6d00';
  return '#ff1744';
}

function getScoreGlow(score: number): string {
  const color = getScoreColor(score);
  if (score >= 75) return 'rgba(0, 230, 118, 0.35)';
  if (score >= 60) return 'rgba(16, 185, 129, 0.3)';
  if (score >= 45) return 'rgba(245, 158, 11, 0.3)';
  if (score >= 30) return 'rgba(255, 109, 0, 0.3)';
  return 'rgba(255, 23, 68, 0.35)';
}

function getRecommendation(score: number): string {
  if (score >= 75) return 'STRONG BUY';
  if (score >= 60) return 'BUY';
  if (score >= 45) return 'HOLD';
  if (score >= 30) return 'REDUCE';
  return 'SELL';
}

// ─── Custom Tooltip ──────────────────────────────────────────────────
function IakTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: IakDataPoint }>; label?: string }) {
  if (!active || !payload || !payload[0]) return null;

  const dp = payload[0].payload;
  const color = getScoreColor(dp.score);
  const rec = getRecommendation(dp.score);

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${color}`,
        borderRadius: '10px',
        padding: '12px 16px',
        backdropFilter: 'blur(12px)',
        boxShadow: `0 4px 20px ${getScoreGlow(dp.score)}`,
        minWidth: '200px',
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
          {dp.score.toFixed(1)}
        </span>
        <span
          style={{
            fontSize: '9px',
            fontWeight: 800,
            color,
            background: color + '18',
            padding: '2px 6px',
            borderRadius: '4px',
            letterSpacing: '0.5px',
          }}
        >
          {rec}
        </span>
      </div>
      <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '6px' }}>
        IAK: ${dp.iakPrice.toFixed(2)}
      </div>
      <div style={{ display: 'grid', gap: '3px', fontSize: '9px' }}>
        {[
          { label: '📈 IAK Trend', value: dp.iakMomentum },
          { label: '🏦 Yield Env', value: dp.yieldEnv },
          { label: '😰 Volatility', value: dp.volatility },
          { label: '💳 Credit', value: dp.creditHealth },
          { label: '📊 Market', value: dp.marketTrend },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
            <span
              style={{
                fontWeight: 700,
                fontFamily: 'monospace',
                color: item.value > 14 ? '#10b981' : item.value > 8 ? '#f59e0b' : '#ff1744',
              }}
            >
              {item.value.toFixed(1)}/20
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Factor Bar ──────────────────────────────────────────────────────
function FactorBar({ label, value, icon }: { label: string; value: number; icon: string }) {
  const barWidth = Math.min((value / 20) * 100, 100);
  const color = value > 14 ? '#10b981' : value > 8 ? '#f59e0b' : '#ff1744';

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
            width: barWidth + '%',
            height: '100%',
            background: value > 14
              ? 'linear-gradient(90deg, #10b981, #00e676)'
              : value > 8
                ? 'linear-gradient(90deg, #f59e0b, #ff6d00)'
                : 'linear-gradient(90deg, #ff6d00, #ff1744)',
            borderRadius: '3px',
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: value > 14 ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none',
          }}
        />
      </div>
      <span
        style={{
          width: '45px',
          textAlign: 'right',
          fontWeight: 800,
          fontFamily: 'monospace',
          fontSize: '10px',
          color,
        }}
      >
        {value.toFixed(1)}/20
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function IakRecommendationChart() {
  const [data, setData] = useState<IakRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('90d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      const response = await fetch('/api/iak-recommendation');
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const result: IakRecommendationResponse = await response.json();
      if (result.data && result.data.length > 0) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch IAK recommendation data:', err);
      setError('Unable to load IAK data');
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
  const currentScore = data?.current?.score ?? 50;
  const currentRec = data?.current?.recommendation ?? 'HOLD';
  const currentColor = getScoreColor(currentScore);
  const currentGlow = getScoreGlow(currentScore);

  const gradientId = 'iakScoreGradient';

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
        <span style={{ fontSize: '28px' }}>🛡️</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '1px' }}>
          ANALYZING IAK...
        </span>
        <div style={{ height: '3px', width: '120px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
          <div
            style={{
              width: '50%',
              height: '100%',
              background: '#10b981',
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
            color: '#10b981',
            background: 'transparent',
            border: '1px solid #10b981',
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
        className="iak-recommendation-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        {/* Title + Live Badge */}
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
              <span style={{ fontSize: '16px' }}>🛡️</span>
              IAK INDEX
            </h2>
            <p style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
              Insurance ETF Recommendation • {timeframe === '30d' ? '30 Day' : timeframe === '60d' ? '60 Day' : '90 Day'} View
            </p>
          </div>

          {/* Score badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: currentColor + '12',
              border: '1px solid ' + currentColor + '40',
              borderRadius: '10px',
              padding: '6px 14px',
              boxShadow: '0 0 20px ' + currentGlow,
              transition: 'all 0.6s ease',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: currentColor,
                boxShadow: '0 0 10px ' + currentColor,
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
              {currentScore.toFixed(1)}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '8px',
                  fontWeight: 800,
                  color: currentColor,
                  letterSpacing: '0.8px',
                  lineHeight: '1.2',
                }}
              >
                {currentRec}
              </span>
            </div>
          </div>

          {/* IAK Price badge */}
          {data?.current && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-panel)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px 12px',
              }}
            >
              <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)' }}>IAK</span>
              <span style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                ${data.current.iakPrice.toFixed(2)}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  color: data.current.iakChange >= 0 ? 'var(--color-gain-bright)' : 'var(--color-loss-bright)',
                }}
              >
                {data.current.iakChange >= 0 ? '+' : ''}{data.current.iakChange.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {/* Controls: Timeframe + Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '3px' }}>
            {(['30d', '60d', '90d'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  background: timeframe === tf ? currentColor + '18' : 'transparent',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid ' + (timeframe === tf ? currentColor : 'var(--border-color)'),
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

      {/* ─── Chart + Sidebar ────────────────────────────────────────── */}
      <div
        className="iak-recommendation-body"
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
                ticks={[0, 30, 45, 60, 75, 100]}
              />

              {/* Threshold reference lines */}
              <ReferenceLine y={75} stroke="#00e676" strokeDasharray="6 4" strokeOpacity={0.5} strokeWidth={1}
                label={{ value: 'BUY 75', position: 'right', fill: '#00e676', fontSize: 8, fontWeight: 700 }} />
              <ReferenceLine y={60} stroke="#10b981" strokeDasharray="6 4" strokeOpacity={0.4} strokeWidth={1}
                label={{ value: 'HOLD 60', position: 'right', fill: '#10b981', fontSize: 8, fontWeight: 700 }} />
              <ReferenceLine y={45} stroke="#f59e0b" strokeDasharray="6 4" strokeOpacity={0.4} strokeWidth={1}
                label={{ value: 'REDUCE 45', position: 'right', fill: '#f59e0b', fontSize: 8, fontWeight: 700 }} />
              <ReferenceLine y={30} stroke="#ff1744" strokeDasharray="6 4" strokeOpacity={0.5} strokeWidth={1}
                label={{ value: 'SELL 30', position: 'right', fill: '#ff1744', fontSize: 8, fontWeight: 700 }} />

              <Tooltip content={<IakTooltip />} />

              <Area
                type="monotone"
                dataKey="score"
                stroke={currentColor}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={'url(#' + gradientId + ')'}
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

        {/* ─── Sidebar ───────────────────────────────────────────────── */}
        {data?.current && (
          <div
            className="iak-recommendation-sidebar"
            style={{
              width: '200px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {/* Score Gauge */}
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
                SCORE GAUGE
              </span>

              <div style={{ position: 'relative', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, #ff1744 0%, #ff6d00 25%, #f59e0b 45%, #10b981 70%, #00e676 100%)',
                    borderRadius: '4px',
                    opacity: 0.4,
                  }}
                />
                {/* Threshold markers */}
                <div style={{ position: 'absolute', left: '30%', top: 0, width: '1px', height: '100%', background: '#ff174480' }} />
                <div style={{ position: 'absolute', left: '45%', top: 0, width: '1px', height: '100%', background: '#ff6d0080' }} />
                <div style={{ position: 'absolute', left: '60%', top: 0, width: '1px', height: '100%', background: '#f59e0b80' }} />
                <div style={{ position: 'absolute', left: '75%', top: 0, width: '1px', height: '100%', background: '#10b98180' }} />
                {/* Position indicator */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    left: Math.min(currentScore, 100) + '%',
                    transform: 'translateX(-50%)',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: currentColor,
                    border: '2px solid var(--bg-surface)',
                    boxShadow: '0 0 8px ' + currentGlow,
                    transition: 'left 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--text-muted)', fontWeight: 700 }}>
                <span>SELL</span>
                <span>BUY</span>
              </div>
            </div>

            {/* Factor Breakdown */}
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
                FACTOR BREAKDOWN
              </span>

              <FactorBar label="IAK Trend" value={data.current.iakMomentum} icon="📈" />
              <FactorBar label="Yield Env" value={data.current.yieldEnv} icon="🏦" />
              <FactorBar label="Volatility" value={data.current.volatility} icon="😰" />
              <FactorBar label="Credit" value={data.current.creditHealth} icon="💳" />
              <FactorBar label="Market" value={data.current.marketTrend} icon="📊" />

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
                Composite of 5 macro factors
                <br />
                Scored 0-100, updated every 5 min
                <br />
                <span style={{ color: 'var(--text-muted)', opacity: 0.7 }}>iShares Insurance ETF (IAK)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
