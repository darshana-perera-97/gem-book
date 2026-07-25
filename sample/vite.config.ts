import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Split long-lived vendor code into its own chunk so app updates don't
      // force users to re-download React on every deploy.
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
      cssCodeSplit: true,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 700,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Local dev: forward API + uploads to a PHP dev server if one is running
      // (php -S localhost:8080 router.php). Harmless when nothing listens there.
      proxy: {
        '/api': { target: 'http://localhost:8080', changeOrigin: true },
        '/uploads': { target: 'http://localhost:8080', changeOrigin: true },
      },
    },
  };
});
