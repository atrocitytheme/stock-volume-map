'use client';

import React, { useEffect, useRef } from 'react';

export default function AdBanner() {
  const adRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    // Prevent double-pushing in React Strict Mode
    if (adRef.current && !pushedRef.current) {
      pushedRef.current = true;
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error('AdSense push error:', err);
      }
    }
  }, []);

  return (
    <div className="ad-container" style={{ 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      padding: '12px',
      marginTop: 'auto', // Pushes it to the bottom if in a flex container
      background: 'var(--bg-surface-glass)',
      borderTop: '1px solid var(--border-color)',
      minHeight: '90px' // Standard mobile ad banner height
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '11px', position: 'absolute', opacity: 0.5 }}>
        Advertisement
      </div>
      
      {/* 
        The actual AdSense block. 
        We use the client ID provided by the user. 
        Note: For this to show live ads, you might also need an ad slot ID (data-ad-slot).
      */}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minWidth: '300px', height: '100%' }}
        data-ad-client="ca-pub-3962513051446394"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
