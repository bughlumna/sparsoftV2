import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { apiFetch } from '../api';

const keyframes = `
  @keyframes loginReveal {
    from { opacity: 0; transform: translateY(30px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes borderGlow {
    0%,100% { box-shadow: 0 0 20px rgba(0,229,255,0.15), 0 0 60px rgba(0,229,255,0.05); }
    50%      { box-shadow: 0 0 35px rgba(0,229,255,0.3),  0 0 80px rgba(0,229,255,0.1); }
  }
  @keyframes iconSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`;

const styles = {
  wrapper: {
    position: 'fixed', inset: 0, zIndex: 50,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    animation: 'loginReveal 0.75s cubic-bezier(0.16,1,0.3,1) both',
  },
  card: {
    position: 'relative',
    background: 'linear-gradient(145deg, rgba(0,20,45,0.85) 0%, rgba(10,5,30,0.9) 100%)',
    border: '1px solid rgba(0,229,255,0.2)',
    borderRadius: 4,
    padding: '3rem 3.5rem',
    minWidth: 340,
    maxWidth: '90vw',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '1.6rem',
    backdropFilter: 'blur(16px)',
    animation: 'borderGlow 4s ease-in-out infinite',
  },
  cornerTL: {
    position: 'absolute', top: -1, left: -1,
    width: 20, height: 20,
    borderTop: '2px solid #00e5ff', borderLeft: '2px solid #00e5ff',
  },
  cornerTR: {
    position: 'absolute', top: -1, right: -1,
    width: 20, height: 20,
    borderTop: '2px solid #00e5ff', borderRight: '2px solid #00e5ff',
  },
  cornerBL: {
    position: 'absolute', bottom: -1, left: -1,
    width: 20, height: 20,
    borderBottom: '2px solid #00e5ff', borderLeft: '2px solid #00e5ff',
  },
  cornerBR: {
    position: 'absolute', bottom: -1, right: -1,
    width: 20, height: 20,
    borderBottom: '2px solid #00e5ff', borderRight: '2px solid #00e5ff',
  },
  logo: {
    fontFamily: "'Orbitron', monospace",
    fontSize: '1.6rem', fontWeight: 900,
    letterSpacing: '0.05em',
    background: 'linear-gradient(135deg, #fff 0%, #a8e6ff 40%, #00e5ff 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(0 0 12px rgba(0,229,255,0.4))',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
  },
  divLine: {
    flex: 1, height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.25))',
  },
  divLineR: {
    flex: 1, height: 1,
    background: 'linear-gradient(90deg, rgba(0,229,255,0.25), transparent)',
  },
  divDiamond: {
    width: 6, height: 6,
    border: '1px solid rgba(0,229,255,0.4)',
    transform: 'rotate(45deg)',
    background: 'rgba(0,229,255,0.1)',
  },
  headline: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '1.15rem', fontWeight: 600,
    letterSpacing: '0.15em', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  sub: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '0.78rem', fontWeight: 400,
    letterSpacing: '0.1em',
    color: 'rgba(160,210,255,0.45)',
    textAlign: 'center',
    marginTop: '-0.8rem',
  },
  googleWrap: {
    display: 'flex', justifyContent: 'center', width: '100%',
    marginTop: '0.5rem',
  },
  errorBox: {
    background: 'rgba(255,60,80,0.1)',
    border: '1px solid rgba(255,60,80,0.3)',
    borderRadius: 4, padding: '10px 18px',
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '0.8rem', letterSpacing: '0.05em',
    color: 'rgba(255,140,150,0.9)', textAlign: 'center',
    maxWidth: 280,
  },
  loadingWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  },
  spinner: {
    width: 32, height: 32,
    border: '2px solid rgba(0,229,255,0.15)',
    borderTop: '2px solid #00e5ff',
    borderRadius: '50%',
    animation: 'iconSpin 0.8s linear infinite',
  },
  loadingText: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '0.78rem', letterSpacing: '0.25em',
    textTransform: 'uppercase', color: 'rgba(0,229,255,0.55)',
  },
  securityNote: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '0.65rem', letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'rgba(0,229,255,0.25)',
    display: 'flex', alignItems: 'center', gap: 6,
    marginTop: '0.5rem',
  },
};

export default function LoginPanel({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/auth/google', {
        method: 'POST',
        body: { token: credentialResponse.credential },
      });
      // Pass user profile + raw Google ID token so authenticated
      // API calls can send it as a Bearer token.
      onLoginSuccess(data.user, credentialResponse.credential);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{keyframes}</style>
      <div style={styles.wrapper}>
        <div style={styles.card}>
          {/* Corner brackets */}
          <div style={styles.cornerTL} />
          <div style={styles.cornerTR} />
          <div style={styles.cornerBL} />
          <div style={styles.cornerBR} />

          <div style={styles.logo}>NQWEST</div>

          <div style={styles.divider}>
            <div style={styles.divLine} />
            <div style={styles.divDiamond} />
            <div style={styles.divLineR} />
          </div>

          <p style={styles.headline}>Secure Access Portal</p>
          <p style={styles.sub}>Please sign in with your Google account</p>

          {loading ? (
            <div style={styles.loadingWrap}>
              <div style={styles.spinner} />
              <span style={styles.loadingText}>Authenticating…</span>
            </div>
          ) : (
            <div style={styles.googleWrap}>
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => setError('Google sign-in was cancelled or failed.')}
                theme="filled_black"
                shape="rectangular"
                size="large"
                text="signin_with"
                logo_alignment="left"
              />
            </div>
          )}

          {error && <div style={styles.errorBox}>{error}</div>}

          <div style={styles.securityNote}>
            <span>⬡</span>
            <span>Secured by OAuth 2.0 · TLS Encrypted</span>
          </div>
        </div>
      </div>
    </>
  );
}
