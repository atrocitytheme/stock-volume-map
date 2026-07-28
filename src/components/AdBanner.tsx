'use client';

import React, { useEffect, useRef } from 'react';

type AdFormat = 'rectangle' | 'anchor' | 'horizontal';

export default function AdBanner({ format = 'horizontal' }: { format?: AdFormat }) {
  const adRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    // Only push to AdSense if the ad slot is currently visible (width > 0).
    // This prevents "No slot size for availableWidth=0" errors when ads are hidden via CSS media queries.
    if (adRef.current && !pushedRef.current) {
      // Use requestAnimationFrame or setTimeout to ensure layout has painted
      const timer = setTimeout(() => {
        if (adRef.current && adRef.current.offsetWidth > 0) {
          pushedRef.current = true;
          try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          } catch (err) {
            console.error('AdSense push error:', err);
          }
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Determine styles based on format
  const getContainerStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'var(--bg-surface-glass)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      position: 'relative',
      overflow: 'hidden',
    };

    switch (format) {
      case 'rectangle':
        return {
          ...baseStyle,
          minHeight: '250px', // 300x250 Medium Rectangle
          padding: '16px',
        };
      case 'anchor':
        return {
          ...baseStyle,
          minHeight: '100px', // 320x100 Sticky Anchor
          padding: '10px',
          borderRadius: '0', // Sticky ads usually span full width at bottom without radius
          borderLeft: 'none',
          borderRight: 'none',
          borderBottom: 'none',
        };
      case 'horizontal':
      default:
        return {
          ...baseStyle,
          minHeight: '100px', // Above-footer banner
          padding: '12px',
        };
    }
  };

  const getLabel = () => {
    switch (format) {
      case 'rectangle': return 'IN-FEED AD PLACEMENT\\n(300x250 Medium Rectangle)';
      case 'anchor': return 'STICKY ANCHOR AD PLACEMENT\\n(320x100 or Responsive)';
      case 'horizontal': return 'GOOGLE ADSENSE PLACEMENT\\n(Above-Footer Banner)';
      default: return 'Advertisement';
    }
  };

  return (
    <div className={`ad-container ad-format-${format}`} style={getContainerStyle()}>
      {/* 
        The actual AdSense block. 
        Once AdSense is approved, Google's script will automatically find this <ins> 
        tag and inject an iframe containing the ad into it.
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

