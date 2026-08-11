"use client";

import React from 'react';
import { ExternalLink } from 'lucide-react';

export default function CapeIndexChart() {
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2>Shiller CAPE Index</h2>
          <p className="subtitle">Live Data Feed</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <a 
            href="https://www.multpl.com/shiller-pe" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--border-color)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface)'}
          >
            Open Full Chart <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* CAPE Interpretation Legend */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        marginTop: '16px',
        padding: '10px 12px',
        backgroundColor: 'var(--bg-default)',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 500,
        justifyContent: 'center',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-primary)' }}>&lt; 15:</span> Undervalued</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
          <span style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-primary)' }}>15 - 20:</span> Fair Value</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f97316' }} />
          <span style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-primary)' }}>20 - 25:</span> Overvalued</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
          <span style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-primary)' }}>&gt; 25:</span> Highly Overvalued</span>
        </div>
      </div>

      <div style={{ 
        width: '100%', 
        height: '350px', 
        marginTop: '20px', 
        position: 'relative', 
        overflow: 'hidden',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        backgroundColor: '#fff' // multpl has a white background
      }}>
        {/* We use negative positioning to try and crop out the ads/nav of the multpl page */}
        <iframe 
          src="https://www.multpl.com/shiller-pe" 
          title="Multpl Shiller PE"
          style={{
            position: 'absolute',
            top: '-240px', // Offset to hide the header and ads
            left: '-10px',
            width: 'calc(100% + 20px)',
            height: '800px',
            border: 'none',
            // Disable pointer events to prevent accidental clicking/scrolling in the iframe
            pointerEvents: 'none',
            transform: 'scale(1.0)',
            transformOrigin: 'top left'
          }}
        />
      </div>
      
      <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
        Live chart data embedded from <a href="https://www.multpl.com/shiller-pe" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)' }}>multpl.com</a>. If the layout appears broken, please open the full chart.
      </div>
    </div>
  );
}
