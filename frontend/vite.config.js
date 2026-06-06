import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // In dev, any path starting with /auth, /features, /feature1, /health
      // is forwarded to FastAPI on localhost:8000.
      // In production the VITE_API_URL env var is used instead (see api.js).
      '/auth':     { target: 'http://localhost:8000', changeOrigin: true },
      '/features': { target: 'http://localhost:8000', changeOrigin: true },
      '/feature1': { target: 'http://localhost:8000', changeOrigin: true },
      '/health':   { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
});
