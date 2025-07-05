import path from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '.'),
    },
  },
  test: {
    coverage: {
      exclude: [
        'tests/**/*.test.{ts,tsx}',
        'tests/**/*.spec.{ts,tsx}',
        '**/*.d.ts',
        '**/index.ts',
        'types/**/*.ts',
        'app/**/*.tsx', // Next.js App Router pages
      ],
      include: [
        'components/**/*.{ts,tsx}',
        'stores/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
      ],
      reporter: ['text', 'json', 'lcov', 'html'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    typecheck: {
      exclude: ['tests/**/*.test.{ts,tsx}', 'tests/**/*.spec.{ts,tsx}'],
      include: [
        'components/**/*.{ts,tsx}',
        'stores/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
      ],
    },
  },
})
