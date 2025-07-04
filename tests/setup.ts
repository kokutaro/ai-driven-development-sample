import '@testing-library/jest-dom'

/**
 * テスト環境のセットアップファイル
 *
 * @description 全テストファイルで共通して実行される設定
 * - jest-domのマッチャーを有効化
 * - window.matchMediaのモック化
 * - その他のDOM APIのモック化
 */

// window.matchMediaのモック化
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// ResizeObserverのモック化
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
