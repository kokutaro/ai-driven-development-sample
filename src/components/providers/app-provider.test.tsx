import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test-utils'

const mockUseSession = vi.fn()
const mockUseUserStore = vi.fn()

vi.mock('next-auth/react', () => ({
  useSession: mockUseSession,
}))

vi.mock('@/stores/user-store', () => ({
  useUserStore: mockUseUserStore,
}))

const setUser = vi.fn()
mockUseUserStore.mockReturnValue({ setUser })

const { AppProvider } = await import('./app-provider')

describe('AppProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('子要素を表示する', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(
      <AppProvider>
        <div>child</div>
      </AppProvider>
    )

    expect(screen.getByText('child')).toBeInTheDocument()
  })

  it('認証済みセッションがある場合はユーザーを設定する', () => {
    const mockSession = {
      user: {
        email: 'test@example.com',
        id: 'user-123',
        image: 'https://example.com/avatar.jpg',
        name: 'Test User',
      },
    }

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    render(
      <AppProvider>
        <div>child</div>
      </AppProvider>
    )

    expect(setUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        id: 'user-123',
        image: 'https://example.com/avatar.jpg',
        name: 'Test User',
      })
    )
  })

  it('未認証の場合はユーザーをクリアする', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(
      <AppProvider>
        <div>child</div>
      </AppProvider>
    )

    expect(setUser).toHaveBeenCalledWith(undefined)
  })

  it('セッション読み込み中は何もしない', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    })

    render(
      <AppProvider>
        <div>child</div>
      </AppProvider>
    )

    expect(setUser).not.toHaveBeenCalled()
  })
})
