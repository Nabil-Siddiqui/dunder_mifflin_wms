import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ============================================================
// Vite Configuration
// ============================================================
// The proxy below forwards any request starting with /api from
// the frontend dev server (e.g. http://localhost:5173) to the
// backend (http://localhost:5000), so the browser never sees a
// cross-origin request during development — avoids needing to
// hardcode the backend URL everywhere in the frontend code.
// ============================================================

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});