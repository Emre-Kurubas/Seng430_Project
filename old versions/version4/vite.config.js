import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // L3: target modern browsers only (smaller output)
    target: 'es2020',
    // L3: no sourcemaps in production build (reduces bundle size)
    sourcemap: false,
    // L3: warn on chunks > 600 KB
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // H1: code-split Three.js and framer-motion into separate lazy chunks
        // so they are not included in the initial JS bundle
        manualChunks: {
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-framer': ['framer-motion'],
          'vendor-react': ['react', 'react-dom'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
})
