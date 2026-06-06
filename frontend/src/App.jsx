import React, { useState, useCallback } from 'react';
import LandingPage from './pages/LandingPage';
import Dashboard   from './pages/Dashboard';

export default function App() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = useCallback((userData) => setUser(userData), []);

  // Clear user → return to landing page (splash skipped, goes straight to login)
  const handleLogout = useCallback(() => {
    setUser(null);
    window.history.pushState({}, '', '/');
  }, []);

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return <LandingPage onLoginSuccess={handleLoginSuccess} />;
}
