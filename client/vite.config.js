import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../dist',
    sourcemap: true,
    emptyOutDir: true
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json']
  },
  cacheDir: '.vite-cache',
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'lucide-react']
  },
  esbuild: {
    supported: {
      'top-level-await': true
    }
  }
})
