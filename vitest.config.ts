import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**', // Playwright E2E tests run separately
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'], // Only cover application source code
      exclude: [
        'node_modules/',
        'tests/',
        'scripts/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/',
        '**/coverage/',
        'src/main.tsx', // Entry point, difficult to test
        'src/App.tsx', // UI component, covered by E2E tests
        'src/vite-env.d.ts',
        'src/contracts/**', // Type definitions and contracts
      ],
      thresholds: {
        lines: 80,
        functions: 75, // Slightly lower due to error callbacks
        branches: 75, // Slightly lower for error paths
        statements: 80,
      },
    },
  },
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
});
