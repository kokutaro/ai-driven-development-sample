/**
 * テストユーティリティ
 * @fileoverview テストで使用する共通ユーティリティ関数とラッパー
 */
import React from 'react'

import { MantineProvider } from '@mantine/core'
import { render } from '@testing-library/react'

import type { RenderOptions } from '@testing-library/react'

/**
 * MantineProviderでラップするテストラッパー
 * @param ui - レンダリングするコンポーネント
 * @returns ラップされたコンポーネント
 */
function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider
      theme={{
        defaultRadius: 'md',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        primaryColor: 'blue',
      }}
    >
      {children}
    </MantineProvider>
  )
}

/**
 * MantineProviderでラップしたレンダリング関数
 * @param ui - レンダリングするコンポーネント
 * @param options - レンダリングオプション
 * @returns レンダリング結果
 */
function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

// re-export everything
export * from '@testing-library/react'

// override render method
export { customRender as render }
