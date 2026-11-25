import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], server: { allowedHosts: true, proxy: { '/api': process.env.API || 'http://localhost:4000' } } });
