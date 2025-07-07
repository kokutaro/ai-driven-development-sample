/**
 * テスト環境のセットアップファイル
 * @fileoverview Vitestで使用するテスト環境の基本設定を行います
 */
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/**
 * 各テスト後にDOMをクリーンアップ
 */
afterEach(() => {
  cleanup()
})

/**
 * グローバルなモックの設定
 */
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}))

/**
 * matchMediaのモック
 */
Object.defineProperty(globalThis, 'matchMedia', {
  value: vi.fn().mockImplementation((query: string) => ({
    addEventListener: vi.fn(),
    addListener: vi.fn(), // deprecated
    dispatchEvent: vi.fn(),
    matches: false,
    media: query,
    onchange: undefined,
    removeEventListener: vi.fn(),
    removeListener: vi.fn(), // deprecated
  })),
  writable: true,
})

/**
 * Next.js routerのモック
 */
vi.mock('next/navigation', () => ({
  usePathname() {
    return ''
  },
  useRouter() {
    return {
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
      push: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

/**
 * 環境変数のモック
 */
vi.mock('@/lib/env', () => ({
  env: {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  },
}))
