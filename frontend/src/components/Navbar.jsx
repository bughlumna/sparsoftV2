import React, { useState, useRef, useEffect } from 'react';
import { googleLogout } from '@react-oauth/google';

const css = `
  .navbar {
    position: fixed; top: 0; left: 0; right: 0; height: 60px; z-index: 200;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 28px;
    background: linear-gradient(90deg, rgba(2,13,26,0.95) 0%, rgba(4,20,40,0.92) 100%);
    border-bottom: 1px solid rgba(0,229,255,0.1);
    backdrop-filter: blur(12px);
  }
  .navbar-logo {
    font-family: 'Orbitron', monospace;
    font-size: 1.15rem; font-weight: 900;
    letter-spacing: 0.1em;
    background: linear-gradient(135deg, #fff 0%, #a8e6ff 40%, #00e5ff 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 8px rgba(0,229,255,0.35));
  }
  .navbar-right {
    display: flex; align-items: center; gap: 14px; position: relative;
  }
  .nav-user-name {
    font-family: 'Rajdhani', sans-serif;
    font-size: 0.78rem; font-weight: 600;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: rgba(160,210,255,0.6);
  }
  .nav-avatar-btn {
    width: 38px; height: 38px; border-radius: 50%;
    border: 2px solid rgba(0,229,255,0.35);
    overflow: hidden; cursor: pointer; background: none; padding: 0;
    transition: border-color 0.25s, box-shadow 0.25s;
    flex-shrink: 0;
  }
  .nav-avatar-btn:hover {
    border-color: rgba(0,229,255,0.8);
    box-shadow: 0 0 14px rgba(0,229,255,0.3);
  }
  .nav-avatar-btn img { width: 100%; height: 100%; object-fit: cover; }
  .nav-avatar-fallback {
    width: 100%; height: 100%;
    background: linear-gradient(135deg, #1565c0, #7c3aed);
    display: flex; align-items: center; justify-content: center;
    font-size: 1rem; font-weight: 700; color: #fff;
    font-family: 'Rajdhani', sans-serif;
  }

  /* Dropdown */
  .nav-dropdown {
    position: absolute; top: calc(100% + 12px); right: 0;
    min-width: 220px;
    background: linear-gradient(145deg, rgba(2,18,40,0.97) 0%, rgba(10,5,30,0.97) 100%);
    border: 1px solid rgba(0,229,255,0.18);
    border-radius: 4px;
    backdrop-filter: blur(16px);
    overflow: hidden;
    animation: dropIn 0.2s cubic-bezier(0.16,1,0.3,1) both;
    box-shadow: 0 16px 40px rgba(0,0,0,0.5), 0 0 30px rgba(0,229,255,0.06);
  }
  @keyframes dropIn {
    from { opacity:0; transform:translateY(-8px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  .nav-dropdown-header {
    padding: 14px 16px 10px;
    border-bottom: 1px solid rgba(0,229,255,0.08);
  }
  .nav-dropdown-name {
    font-family: 'Rajdhani', sans-serif;
    font-size: 0.85rem; font-weight: 600;
    letter-spacing: 0.08em; color: rgba(255,255,255,0.85);
  }
  .nav-dropdown-email {
    font-family: 'Rajdhani', sans-serif;
    font-size: 0.7rem; letter-spacing: 0.05em;
    color: rgba(160,210,255,0.4); margin-top: 2px;
  }
  .nav-dropdown-logout {
    width: 100%; background: transparent; border: none;
    padding: 12px 16px;
    display: flex; align-items: center; gap: 10px;
    font-family: 'Rajdhani', sans-serif;
    font-size: 0.75rem; font-weight: 600;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: rgba(255,120,120,0.7);
    cursor: pointer; transition: all 0.2s;
    text-align: left;
  }
  .nav-dropdown-logout:hover {
    background: rgba(255,60,60,0.08);
    color: rgba(255,180,180,0.95);
  }
`;

export default function Navbar({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    googleLogout();
    onLogout();
  };

  return (
    <>
      <style>{css}</style>
      <nav className="navbar">
        <div className="navbar-logo">NQWEST</div>

        <div className="navbar-right" ref={ref}>
          <span className="nav-user-name">{user.name}</span>

          <button className="nav-avatar-btn" onClick={() => setOpen(o => !o)}>
            {user.picture
              ? <img src={user.picture} alt={user.name} />
              : <div className="nav-avatar-fallback">{user.name?.[0] ?? '?'}</div>
            }
          </button>

          {open && (
            <div className="nav-dropdown">
              <div className="nav-dropdown-header">
                <div className="nav-dropdown-name">{user.name}</div>
                <div className="nav-dropdown-email">{user.email}</div>
              </div>
              <button className="nav-dropdown-logout" onClick={handleLogout}>
                ⏻ &nbsp;Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
