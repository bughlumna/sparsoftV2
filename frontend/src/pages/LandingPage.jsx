import React, { useState } from 'react';
import WaveCanvas    from '../components/WaveCanvas';
import SplashScreen  from '../components/SplashScreen';
import LoginPanel    from '../components/LoginPanel';

// Shared background decorations shown on both splash & login
function BackgroundScene() {
  return (
    <>
      {/* Deep radial gradient overlays */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: `
          radial-gradient(ellipse 80% 60% at 50% 80%, rgba(0,120,180,0.32) 0%, transparent 70%),
          radial-gradient(ellipse 40% 40% at 30% 60%, rgba(0,229,255,0.1)  0%, transparent 60%),
          radial-gradient(ellipse 50% 50% at 70% 55%, rgba(180,0,255,0.1)  0%, transparent 60%),
          linear-gradient(170deg, #020d1a 0%, #041428 40%, #060820 100%)
        `,
      }} />

      {/* Subtle grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
      }} />

      {/* Scan line */}
      <style>{`
        @keyframes scan { from { top:-10px } to { top:100vh } }
        .scanline {
          position: fixed; left:0; right:0; height:3px; z-index:3; pointer-events:none;
          background: linear-gradient(90deg, transparent, rgba(0,229,255,0.55), rgba(224,64,251,0.35), transparent);
          animation: scan 5s linear infinite;
        }
      `}</style>
      <div className="scanline" />
    </>
  );
}

export default function LandingPage({ onLoginSuccess }) {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <BackgroundScene />
      <WaveCanvas />

      {showSplash
        ? <SplashScreen onDismiss={() => setShowSplash(false)} />
        : <LoginPanel  onLoginSuccess={onLoginSuccess} />
      }
    </div>
  );
}
