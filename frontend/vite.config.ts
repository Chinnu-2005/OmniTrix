import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/upload-image': 'https://omnitrix-ai.onrender.com'
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
