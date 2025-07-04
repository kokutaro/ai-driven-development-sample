import { resolve } from 'path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * Vitestの設定ファイル
 *
 * @description テスト実行環境の設定
 * - Reactプラグインの有効化
 * - パスエイリアスの設定
 * - テスト環境の設定
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
