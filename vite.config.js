import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Bind to all interfaces for Tailscale access
    port: 5174,
    strictPort: true, // Don't fallback to next port if this one is taken
    hmr: {
      clientPort: 5174,
    },
  },
});
