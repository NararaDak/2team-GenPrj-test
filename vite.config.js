import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/addhelper': {
        target: 'https://gen-proj.duckdns.org',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
