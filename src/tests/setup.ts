import '@testing-library/jest-dom'
import { vi } from 'vitest'

// window.matchMedia のモック
Object.defineProperty(globalThis, 'matchMedia', {
  value: vi.fn().mockImplementation((query) => ({
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

// ResizeObserver のモック
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
})) as unknown as typeof ResizeObserver

// console.error の意図的なエラーテスト用抑制
const originalConsoleError = console.error
const suppressedErrorMessages = [
  'カテゴリ取得エラー:',
  'カテゴリ作成エラー:',
  'TODO取得エラー:',
  'TODO完了状態切り替えエラー:',
  'タスク作成エラー:',
]

console.error = (...args: unknown[]) => {
  const message = String(args[0])

  // 意図的なエラーテストメッセージは抑制
  if (
    suppressedErrorMessages.some((suppressedMsg) =>
      message.includes(suppressedMsg)
    )
  ) {
    return
  }

  // その他のエラーは通常通り表示
  originalConsoleError(...args)
}
