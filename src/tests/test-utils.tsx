import type { ReactElement } from 'react'

import { MantineProvider } from '@mantine/core'
import { render } from '@testing-library/react'

import type { RenderOptions } from '@testing-library/react'

/**
 * MantineProviderでラップされたカスタムrender関数
 *
 * @param ui - レンダリングするReactElement
 * @param options - render関数のオプション
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <MantineProvider>{children}</MantineProvider>
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

export * from '@testing-library/react'
export { customRender as render }
