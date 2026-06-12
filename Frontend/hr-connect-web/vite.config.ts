import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy `/api/*` to the .NET backend (see Backend launchSettings.json).
      // We hit the HTTP profile to avoid dev-cert prompts; switch to
      // `https://localhost:7181` once the cert is trusted.
      '/api': {
        target: 'https://hrconnect-api-priya-buccf7fwbmgnfecu.centralindia-01.azurewebsites.net/api',
        secure: false,
        changeOrigin: true,
      },
    },
  },
});
