import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const localServer = {
  host: 'localhost',
  port: 8081,
  strictPort: true,
  allowedHosts: ['localhost', '127.0.0.1'],
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:8787',
      // Preserve the browser Origin and Host for API checks and localhost cookies.
      changeOrigin: false,
    },
  },
};

export default defineConfig({
  plugins: [react()],
  appType: 'spa',
  server: { ...localServer, forwardConsole: false },
  preview: localServer,
  build: { outDir: 'dist', target: 'es2022' },
});
