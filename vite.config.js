/* eslint-env node */
/* global process */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src')
    }
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB limit for large files
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}']
      },
      includeAssets: ['favicon.ico', 'icons/icon-192x192.png', 'icons/icon-512x512.png'],
      manifest: {
        name: 'Carga de Datos',
        short_name: 'CargaDatos',
        description: 'App para gestionar registros de tela',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
