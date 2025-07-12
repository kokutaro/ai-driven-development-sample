import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test-utils'

const mockUseUserStore = vi.fn()
vi.mock('@/stores/user-store', () => ({
  useUserStore: mockUseUserStore,
}))

const setUser = vi.fn()
mockUseUserStore.mockReturnValue({ setUser })

const { AppProvider } = await import('./app-provider')

describe('AppProvider', () => {
  it('子要素を表示しデモユーザーを設定する', () => {
    render(
      <AppProvider>
        <div>child</div>
      </AppProvider>
    )

    expect(screen.getByText('child')).toBeInTheDocument()
    expect(setUser).toHaveBeenCalledTimes(1)
    expect(setUser.mock.calls[0][0]).toMatchObject({
      email: 'demo@example.com',
      id: 'user-1',
      name: 'デモユーザー',
    })
  })

  it('再レンダリングしてもsetUserは1回だけ呼ばれる', () => {
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
    expect(setUser).toHaveBeenCalledTimes(2)
  })
})
