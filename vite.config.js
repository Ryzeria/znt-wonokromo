import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          turf: ['@turf/turf'],
          leaflet: ['leaflet', 'react-leaflet']
        }
      }
    }
  }
})
