import React, { useEffect } from 'react';
import { googleLogout } from '@react-oauth/google';

const keyframes = `
  @keyframes dashReveal {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes avatarGlow {
    0%,100% { box-shadow: 0 0 0 2px rgba(0,229,255,0.3), 0 0 20px rgba(0,229,255,0.15); }
    50%      { box-shadow: 0 0 0 3px rgba(0,229,255,0.6), 0 0 35px rgba(0,229,255,0.3); }
  }
  .logout-btn {
    background: transparent;
    border: 1px solid rgba(255,80,80,0.3);
    color: rgba(255,140,140,0.7);
    font-family: 'Rajdhani', sans-serif;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    padding: 8px 24px;
    clip-path: polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%);
    cursor: pointer;
    transition: all 0.25s ease;
    margin-top: 0.4rem;
  }
  .logout-btn:hover {
    background: rgba(255,60,60,0.1);
    border-color: rgba(255,80,80,0.7);
    color: rgba(255,180,180,0.95);
    box-shadow: 0 0 18px rgba(255,60,60,0.2);
  }
`;

const styles = {
  page: {
    minHeight: '100vh', width: '100vw',
    background: 'linear-gradient(170deg, #020d1a 0%, #041428 50%, #060820 100%)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Rajdhani', sans-serif",
    animation: 'dashReveal 0.7s ease both',
  },
  card: {
    background: 'linear-gradient(145deg, rgba(0,20,45,0.8) 0%, rgba(10,5,30,0.85) 100%)',
    border: '1px solid rgba(0,229,255,0.2)',
    borderRadius: 4,
    padding: '3rem 4rem',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '1.4rem',
    backdropFilter: 'blur(16px)',
    minWidth: 360,
  },
  logo: {
    fontFamily: "'Orbitron', monospace",
    fontSize: '1.3rem', fontWeight: 900,
    background: 'linear-gradient(135deg, #fff 0%, #a8e6ff 40%, #00e5ff 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '0.1em',
    filter: 'drop-shadow(0 0 10px rgba(0,229,255,0.35))',
  },
  avatar: {
    width: 72, height: 72, borderRadius: '50%',
    objectFit: 'cover',
    animation: 'avatarGlow 3s ease-in-out infinite',
  },
  avatarFallback: {
    width: 72, height: 72, borderRadius: '50%',
    background: 'linear-gradient(135deg, #1565c0, #7c3aed)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.8rem', fontWeight: 700, color: '#fff',
    animation: 'avatarGlow 3s ease-in-out infinite',
  },
  greeting: {
    fontFamily: "'Orbitron', monospace",
    fontSize: '1rem', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: '#fff',
  },
  email: {
    fontSize: '0.8rem', letterSpacing: '0.08em',
    color: 'rgba(160,210,255,0.5)',
    marginTop: '-0.6rem',
  },
  statusRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(0,229,255,0.06)',
    border: '1px solid rgba(0,229,255,0.15)',
    borderRadius: 100, padding: '5px 16px',
  },
  statusDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#00e5ff', boxShadow: '0 0 8px #00e5ff',
  },
  statusText: {
    fontSize: '0.7rem', letterSpacing: '0.25em',
    textTransform: 'uppercase', color: 'rgba(0,229,255,0.6)',
  },
  message: {
    fontSize: '0.82rem', letterSpacing: '0.08em',
    color: 'rgba(160,210,255,0.45)',
    textAlign: 'center', maxWidth: 280,
    lineHeight: 1.7,
  },
  divider: {
    width: '100%', height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(255,80,80,0.15), transparent)',
    marginTop: '0.4rem',
  },
};

export default function Dashboard({ user, onLogout }) {
  useEffect(() => {
    window.history.pushState({}, '', '/index.html');
  }, []);

  const handleLogout = () => {
    googleLogout();   // clears Google's session cookie
    onLogout();       // resets App state → back to landing page
  };

  return (
    <>
      <style>{keyframes}</style>
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logo}>NQWEST</div>

          {user.picture
            ? <img src={user.picture} alt={user.name} style={styles.avatar} />
            : <div style={styles.avatarFallback}>{user.name?.[0] ?? '?'}</div>
          }

          <div style={styles.greeting}>Welcome, {user.name}</div>
          <div style={styles.email}>{user.email}</div>

          <div style={styles.statusRow}>
            <div style={styles.statusDot} />
            <span style={styles.statusText}>Authenticated · Session Active</span>
          </div>

          <p style={styles.message}>
            You are now connected to the Nqwest platform.
            Your dashboard is loading…
          </p>

          <div style={styles.divider} />

          <button className="logout-btn" onClick={handleLogout}>
            ⏻ &nbsp;Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
