import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test-utils'

const mockUseUserStore = vi.fn()
vi.mock('@/stores/user-store', () => ({
  useUserStore: mockUseUserStore,
}))

const initializeAuth = vi.fn()
mockUseUserStore.mockReturnValue({ initializeAuth })

const { AppProvider } = await import('./app-provider')

describe('AppProvider', () => {
  it('子要素を表示し認証状態を初期化する', () => {
    render(
      <AppProvider>
        <div>child</div>
      </AppProvider>
    )

    expect(screen.getByText('child')).toBeInTheDocument()
    expect(initializeAuth).toHaveBeenCalledTimes(1)
  })

  it('再レンダリングしてもinitializeAuthは1回だけ呼ばれる', () => {
    const { rerender } = render(
      <AppProvider>
        <span>first</span>
      </AppProvider>
    )
    rerender(
      <AppProvider>
        <span>second</span>
      </AppProvider>
    )

    expect(screen.getByText('second')).toBeInTheDocument()
    expect(initializeAuth).toHaveBeenCalledTimes(2)
  })
})
