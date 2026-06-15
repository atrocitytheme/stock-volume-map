"use client";

import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { generate24hVolumeData } from '@/utils/marketVolumeData';

export default function MarketVolumeChart({ isDataFlashing }: { isDataFlashing?: boolean }) {
  // Generate static aesthetic data once per session
  const data = useMemo(() => generate24hVolumeData(), []);

  return (
    <div className="glass-panel" style={{ 
      height: '100%', 
      padding: '16px', 
      flexDirection: 'column',
      background: isDataFlashing ? 'var(--bg-gain-faded)' : 'var(--bg-surface-glass)',
      boxShadow: isDataFlashing ? 'inset 0 0 50px rgba(16, 185, 129, 0.15)' : 'none',
      transition: 'all 0.5s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
            TOTAL MARKET VOLUME
          </h2>
          <p style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>Past 24 Hours (Est. Shares Traded)</p>
        </div>
        <div style={{ 
          background: 'rgba(16, 185, 129, 0.1)', 
          padding: '4px 8px', 
          borderRadius: '4px', 
          border: '1px solid var(--color-gain-bright)',
          fontSize: '10px',
          fontWeight: 800,
          color: 'var(--color-gain-bright)'
        }}>
          LIVE MODEL
        </div>
      </div>

      <div style={{ flex: 1, width: '100%', minHeight: '150px' }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={150}>
          <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-volume)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="var(--color-volume)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
              minTickGap={40}
            />
            <YAxis 
              hide={true} 
              domain={['dataMin', 'dataMax']} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-surface)', 
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
                fontSize: '11px',
                fontWeight: 600
              }}
              itemStyle={{ color: 'var(--color-volume)' }}
              formatter={(value: any) => [new Intl.NumberFormat('en-US').format(Number(value) || 0) + ' shares', 'Volume']}
              labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="volume" 
              stroke="var(--color-volume)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorVolume)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
