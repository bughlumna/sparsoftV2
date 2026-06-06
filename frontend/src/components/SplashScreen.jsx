import React, { useEffect, useState } from 'react';

const styles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 100,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    transition: 'opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  overlayBg: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,40,80,0.55) 0%, rgba(2,13,26,0.85) 100%)',
    backdropFilter: 'blur(2px)',
  },
  content: {
    position: 'relative', zIndex: 1,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '1.4rem',
    animation: 'splashReveal 1s cubic-bezier(0.16, 1, 0.3, 1) both',
  },
  badge: {
    display: 'flex', alignItems: 'center', gap: 9,
    background: 'rgba(0,229,255,0.06)',
    border: '1px solid rgba(0,229,255,0.2)',
    borderRadius: 100,
    padding: '5px 18px',
    animation: 'splashReveal 1s 0.1s both',
  },
  badgeDot: {
    width: 7, height: 7, borderRadius: '50%',
    background: '#00e5ff',
    boxShadow: '0 0 10px #00e5ff',
    animation: 'pulse 2s ease-in-out infinite',
  },
  badgeText: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '0.72rem', fontWeight: 500,
    letterSpacing: '0.3em', textTransform: 'uppercase',
    color: 'rgba(0,229,255,0.7)',
  },
  welcome: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
    fontWeight: 500, letterSpacing: '0.5em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.4)',
    animation: 'splashReveal 1s 0.2s both',
  },
  title: {
    fontFamily: "'Orbitron', monospace",
    fontSize: 'clamp(3.2rem, 10vw, 7rem)',
    fontWeight: 900, lineHeight: 1,
    letterSpacing: '-0.02em', textTransform: 'uppercase',
    background: 'linear-gradient(135deg, #fff 0%, #a8e6ff 30%, #00e5ff 55%, #b47fff 80%, #e040fb 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(0 0 40px rgba(0,229,255,0.45))',
    animation: 'splashReveal 1s 0.3s both, titleGlow 4s 1.3s ease-in-out infinite alternate',
  },
  tagline: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 'clamp(0.8rem, 1.6vw, 1rem)',
    fontWeight: 400, letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: 'rgba(160,210,255,0.5)',
    animation: 'splashReveal 1s 0.45s both',
  },
  hint: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '0.72rem', letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'rgba(0,229,255,0.3)',
    marginTop: '2.5rem',
    animation: 'splashReveal 1s 0.9s both, hintPulse 2.5s 1.9s ease-in-out infinite',
  },
  timerBar: {
    position: 'absolute', bottom: 0, left: 0,
    height: 2,
    background: 'linear-gradient(90deg, #00e5ff, #b47fff, #e040fb)',
    boxShadow: '0 0 8px rgba(0,229,255,0.5)',
    animation: 'timerShrink 5s linear forwards',
    transformOrigin: 'left',
  },
};

const keyframes = `
  @keyframes splashReveal {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes titleGlow {
    from { filter: drop-shadow(0 0 30px rgba(0,229,255,0.3)); }
    to   { filter: drop-shadow(0 0 70px rgba(0,229,255,0.75)) drop-shadow(0 0 110px rgba(180,100,255,0.35)); }
  }
  @keyframes pulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%      { opacity:0.4; transform:scale(0.75); }
  }
  @keyframes hintPulse {
    0%,100% { opacity:0.4; }
    50%      { opacity:1; }
  }
  @keyframes timerShrink {
    from { width: 100%; }
    to   { width: 0%; }
  }
`;

export default function SplashScreen({ onDismiss }) {
  const [fading, setFading] = useState(false);

  const dismiss = () => {
    if (fading) return;
    setFading(true);
    setTimeout(onDismiss, 850);
  };

  // Auto-dismiss after 5 s
  useEffect(() => {
    const timer = setTimeout(dismiss, 5000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line

  return (
    <>
      <style>{keyframes}</style>
      <div
        style={{ ...styles.overlay, opacity: fading ? 0 : 1 }}
        onClick={dismiss}
        aria-label="Click to continue"
      >
        <div style={styles.overlayBg} />

        <div style={styles.content}>
          <div style={styles.badge}>
            <div style={styles.badgeDot} />
            <span style={styles.badgeText}>System Online</span>
          </div>

          <div style={styles.welcome}>Welcome to</div>

          <h1 style={styles.title}>Nqwest</h1>

          <p style={styles.tagline}>
            Next Generation Connectivity &nbsp;·&nbsp; Powered by Intelligence
          </p>

          <p style={styles.hint}>Click anywhere to continue ↓</p>
        </div>

        {/* 5-second progress bar at bottom */}
        <div style={styles.timerBar} />
      </div>
    </>
  );
}
