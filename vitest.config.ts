import path from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    coverage: {
      exclude: [
        'src/tests/**/*.test.{ts,tsx}',
        'src/tests/**/*.spec.{ts,tsx}',
        '**/*.d.ts',
        '**/index.ts',
        'src/types/**/*.ts',
        'src/app/**/*.tsx', // Next.js App Router pages
        'mcp-server/**/*', // MCP server code
      ],
      include: ['src/**/*.{ts,tsx}'],
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
    setupFiles: ['./src/tests/setup.ts'],
  },
})
