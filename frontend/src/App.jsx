import React, { useState, useCallback } from 'react';
import LandingPage from './pages/LandingPage';
import Dashboard   from './pages/Dashboard';

export default function App() {
  const [user,  setUser]  = useState(null);
  const [token, setToken] = useState(null); // Google ID token — sent on every auth'd request

  const handleLoginSuccess = useCallback((userData, idToken) => {
    setUser(userData);
    setToken(idToken);
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setToken(null);
    window.history.pushState({}, '', '/');
  }, []);

  if (user) {
    return <Dashboard user={user} token={token} onLogout={handleLogout} />;
  }

  return <LandingPage onLoginSuccess={handleLoginSuccess} />;
}
