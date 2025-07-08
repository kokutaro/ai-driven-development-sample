import type { ReactElement } from 'react'

import { MantineProvider } from '@mantine/core'
import { DatesProvider } from '@mantine/dates'
import { ModalsProvider } from '@mantine/modals'
import { render } from '@testing-library/react'

import type { RenderOptions } from '@testing-library/react'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'

/**
 * カスタムレンダー関数
 *
 * テスト用にMantineProviderでコンポーネントをラップします。
 * すべてのテストでMantineのコンポーネントが正しく動作するようにします。
 */
function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider>
      <ModalsProvider>
        <DatesProvider settings={{ firstDayOfWeek: 0, locale: 'ja' }}>
          {children}
        </DatesProvider>
      </ModalsProvider>
    </MantineProvider>
  )
}

/**
 * カスタムレンダー関数
 *
 * @param ui - レンダリングするReactElement
 * @param options - レンダリングオプション
 * @returns レンダリング結果
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

export * from '@testing-library/react'
export { customRender as render }
export { customRender as renderWithProviders }
