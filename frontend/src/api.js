/**
 * api.js — single source of truth for the backend base URL.
 *
 * In development:  VITE_API_URL is not set, so we fall back to an empty
 *                  string, which means fetch('/auth/google') hits the Vite
 *                  dev-server proxy (defined in vite.config.js) → localhost:8000.
 *
 * In production:   Set VITE_API_URL in your Vercel project environment variables
 *                  to your Render backend URL, e.g.
 *                  https://nqwest-api.onrender.com
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * Convenience wrapper — prepends API_BASE and always sends JSON.
 * For authenticated calls pass { token } in options.
 *
 * Usage:
 *   const data = await apiFetch('/auth/google', { method:'POST', body: payload });
 *   const data = await apiFetch('/features',    { token });
 *   const data = await apiFetch('/feature1',    { method:'POST', body: payload, token });
 */
export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) throw new Error('Session expired — please log in again.');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Server error ' + res.status);
  }
  return res.json();
}
