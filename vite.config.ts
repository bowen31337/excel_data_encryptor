import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Single-file build plugin (only in 'single' mode)
    ...(mode === 'single' ? [viteSingleFile()] : []),
    // PWA plugin (always enabled)
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/icon-192.svg', 'assets/icon-512.svg'],
      manifest: {
        name: 'Excel Data Encryptor',
        short_name: 'Excel Encrypt',
        description:
          'Encrypt sensitive data in Excel and CSV files using SHA-256 hashing, entirely in your browser.',
        theme_color: '#1890ff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'assets/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: 'assets/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,png,jpg,jpeg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  base: mode === 'single' ? './' : '/excel_data_encryptor/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: mode !== 'single',
    // Single-file build configuration
    ...(mode === 'single'
      ? {
          assetsInlineLimit: 100000000, // Inline all assets
          cssCodeSplit: false,
          rollupOptions: {
            output: {
              inlineDynamicImports: true,
            },
          },
        }
      : {
          rollupOptions: {
            output: {
              manualChunks: {
                vendor: ['react', 'react-dom', 'antd'],
                excel: ['xlsx', 'papaparse'],
              },
            },
          },
        }),
  },
}));
