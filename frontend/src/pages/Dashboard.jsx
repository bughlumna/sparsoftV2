import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Feature1Form from '../components/Feature1Form';
import { apiFetch } from '../api';

const css = `
  @keyframes dashReveal {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes featureReveal {
    from { opacity:0; transform:translateY(20px) scale(0.96); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes shimmer {
    from { background-position: -400px 0; }
    to   { background-position: 400px 0; }
  }

  .dash-page {
    min-height: 100vh; width: 100vw;
    background: linear-gradient(170deg, #020d1a 0%, #041428 55%, #060820 100%);
    font-family: 'Rajdhani', sans-serif;
    display: flex; flex-direction: column;
  }

  /* ── Main content area (below navbar) ── */
  .dash-main {
    flex: 1;
    padding-top: 60px; /* navbar height */
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 0;
    animation: dashReveal 0.6s ease both;
  }

  /* ── Section header ── */
  .dash-section-label {
    font-size: 0.65rem; font-weight: 600;
    letter-spacing: 0.4em; text-transform: uppercase;
    color: rgba(0,229,255,0.35);
    margin-bottom: 1.6rem;
    display: flex; align-items: center; gap: 12px;
  }
  .dash-section-label::before,
  .dash-section-label::after {
    content: ''; flex: 1 0 40px; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,229,255,0.2));
  }
  .dash-section-label::after {
    background: linear-gradient(90deg, rgba(0,229,255,0.2), transparent);
  }

  /* ── Feature grid ── */
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
    width: min(540px, 90vw);
  }

  /* ── Feature button ── */
  .feature-btn {
    position: relative; overflow: hidden;
    background: linear-gradient(145deg, rgba(0,20,50,0.7) 0%, rgba(8,4,28,0.75) 100%);
    border: 1px solid rgba(0,229,255,0.18);
    border-radius: 3px;
    padding: 28px 20px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 10px;
    cursor: pointer; color: #fff;
    transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
    clip-path: polygon(14px 0%, 100% 0%, calc(100% - 14px) 100%, 0% 100%);
    text-align: center;
  }
  .feature-btn::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(0,229,255,0.07), rgba(124,58,237,0.05));
    opacity: 0; transition: opacity 0.25s;
  }
  .feature-btn:hover {
    border-color: rgba(0,229,255,0.55);
    box-shadow: 0 0 28px rgba(0,229,255,0.18), inset 0 0 20px rgba(0,229,255,0.04);
    transform: translateY(-2px);
  }
  .feature-btn:hover::before { opacity: 1; }
  .feature-btn:active { transform: translateY(0) scale(0.98); }

  /* Shimmer sweep on hover */
  .feature-btn::after {
    content: '';
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
    transition: left 0.45s ease;
  }
  .feature-btn:hover::after { left: 150%; }

  .feature-icon {
    font-size: 1.6rem; line-height: 1;
    filter: drop-shadow(0 0 8px rgba(0,229,255,0.5));
  }
  .feature-name {
    font-family: 'Orbitron', monospace;
    font-size: 0.7rem; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: rgba(255,255,255,0.85);
    position: relative; z-index: 1;
  }
  .feature-sub {
    font-size: 0.68rem; letter-spacing: 0.06em;
    color: rgba(160,210,255,0.4);
    position: relative; z-index: 1;
  }

  /* Loading skeleton */
  .feature-skeleton {
    background: linear-gradient(90deg,
      rgba(0,229,255,0.04) 25%,
      rgba(0,229,255,0.09) 50%,
      rgba(0,229,255,0.04) 75%
    );
    background-size: 400px 100%;
    border: 1px solid rgba(0,229,255,0.08);
    border-radius: 3px;
    height: 110px;
    animation: shimmer 1.4s ease-in-out infinite;
  }

  /* Error state */
  .dash-error {
    color: rgba(255,140,140,0.7);
    font-size: 0.78rem; letter-spacing: 0.1em;
    border: 1px solid rgba(255,80,80,0.2);
    padding: 12px 24px; border-radius: 3px;
    background: rgba(255,40,40,0.05);
  }
`;

// Icon pool — cycles through these for each feature button
const ICONS = ['◈', '⬡', '◎', '⟁', '⬟', '◇', '⊕', '⋈'];

export default function Dashboard({ user, token, onLogout }) {
  const [features, setFeatures] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [activeFeature, setActiveFeature] = useState(null);

  // fetchFeatures must be defined before useEffect so the closure
  // captures the real `token` value, not undefined.
  const fetchFeatures = async (idToken) => {
    if (!idToken) {
      setError('No auth token available — please log in again.');
      setLoading(false);
      return;
    }
    setLoading(true); setError(null);
    try {
      const res = await fetch('http://localhost:8000/features', {
        headers: { Authorization: 'Bearer ' + idToken },
      });
      if (res.status === 401) throw new Error('Session expired — please log in again.');
      if (!res.ok) throw new Error('Server error ' + res.status);
      const data = await res.json();
      setFeatures(data.features);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.history.pushState({}, '', '/index.html');
    fetchFeatures(token);       // pass token directly — no stale closure
  }, [token]);                  // re-fetch if token ever rotates

  return (
    <>
      <style>{css}</style>

      <div className="dash-page">
        <Navbar user={user} onLogout={onLogout} />

        <main className="dash-main">
          <div className="dash-section-label">Select a Feature</div>

          <div className="feature-grid">
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="feature-skeleton"
                style={{ animationDelay: `${i * 0.1}s` }} />
            ))}

            {error && (
              <div className="dash-error" style={{ gridColumn: '1 / -1' }}>
                ⚠ Could not load features: {error}
              </div>
            )}

            {!loading && !error && features.map((feat, i) => (
              <button
                key={feat.id}
                className="feature-btn"
                style={{ animation: `featureReveal 0.5s ${i * 0.08}s cubic-bezier(0.16,1,0.3,1) both` }}
                onClick={() => setActiveFeature(feat.id)}
              >
                <span className="feature-icon">{ICONS[i % ICONS.length]}</span>
                <span className="feature-name">{feat.name}</span>
                {feat.description && (
                  <span className="feature-sub">{feat.description}</span>
                )}
              </button>
            ))}
          </div>
        </main>
      </div>
      {activeFeature === 'feature_1' && (
        <Feature1Form token={token} onClose={() => setActiveFeature(null)} />
      )}
    </>
  );
}
