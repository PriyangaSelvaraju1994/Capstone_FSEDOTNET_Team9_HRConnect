import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            // When the real backend is wired up, requests to /api are proxied to it.
            // While the mock JSON auth is in use, this proxy is unused.
            '/api': {
                target: 'https://localhost:5001',
                secure: false,
                changeOrigin: true,
            },
        },
    },
});
