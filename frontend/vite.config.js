import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['unrented-ranger-rummage.ngrok-free.dev'],
    // Enable SPA history fallback so /chat/:id routes work on refresh.
    historyApiFallback: true,
  },
});
