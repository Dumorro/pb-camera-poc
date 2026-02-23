import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      manifest: {
        name: 'P&B Camera PoC',
        short_name: 'PB-Cam',
        start_url: '/',
        display: 'standalone',
        theme_color: '#000000',
        background_color: '#111111',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
      },
      devOptions: { enabled: true },
    }),
  ],
  assetsInclude: ['**/*.wasm'],
  server: {
    https: false, // set to true + provide certs for mobile testing
    host: true,
  },
})
