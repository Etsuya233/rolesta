import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  envPrefix: ['VITE_', 'API_'],
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@rolesta/shared': path.resolve(import.meta.dirname, '../../packages/shared/src/index.ts'),
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        rewrite: (url) => url.replace(/^\/api/, ''),
      },
    },
  },
});
