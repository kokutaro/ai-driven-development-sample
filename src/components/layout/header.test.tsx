import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'

import { Header } from './header'

import { useUserStore } from '@/stores/user-store'

// Zustandストアのモック
vi.mock('@/stores/user-store')

// useClientOnlyフックのモック
vi.mock('@/hooks/use-client-only', () => ({
  useClientOnly: () => true,
}))

// auth関連のモック
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
  getUserIdFromRequest: vi.fn(),
  isAuthenticated: vi.fn(),
  requireAuth: vi.fn(),
}))

// NextAuth.jsのモック
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

const mockUseUserStore = vi.mocked(useUserStore)

// テスト用のヘルパー関数
function renderWithProvider(component: React.ReactElement) {
  return render(<MantineProvider>{component}</MantineProvider>)
}

describe('Header', () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    vi.clearAllMocks()
  })

  it('アプリケーション名「To Do」を表示する', () => {
    // Arrange
    mockUseUserStore.mockReturnValue({
      clearUser: vi.fn(),
      initializeAuth: vi.fn(),
      isAuthenticated: false,
      isLoading: false,
      refreshUser: vi.fn(),
      reset: vi.fn(),
      setUser: vi.fn(),
      updateUser: vi.fn(),
      user: undefined,
    })

    // Act
    renderWithProvider(<Header />)

    // Assert
    expect(screen.getByRole('heading', { name: 'To Do' })).toBeInTheDocument()
  })

  it('検索バーが表示される', () => {
    // Arrange
    mockUseUserStore.mockReturnValue({
      clearUser: vi.fn(),
      initializeAuth: vi.fn(),
      isAuthenticated: false,
      isLoading: false,
      refreshUser: vi.fn(),
      reset: vi.fn(),
      setUser: vi.fn(),
      updateUser: vi.fn(),
      user: undefined,
    })

    // Act
    renderWithProvider(<Header />)

    // Assert
    expect(screen.getByPlaceholderText('タスクを検索...')).toBeInTheDocument()
  })

  it('設定ボタンとヘルプボタンが表示される', () => {
    // Arrange
    mockUseUserStore.mockReturnValue({
      clearUser: vi.fn(),
      initializeAuth: vi.fn(),
      isAuthenticated: false,
      isLoading: false,
      refreshUser: vi.fn(),
      reset: vi.fn(),
      setUser: vi.fn(),
      updateUser: vi.fn(),
      user: undefined,
    })

    // Act
    renderWithProvider(<Header />)

    // Assert
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2) // 設定ボタンとヘルプボタン
  })

  it('ユーザーが設定されている場合、ユーザー名でAvatarを表示する', () => {
    // Arrange
    const mockUser = {
      createdAt: new Date(),
      email: 'test@example.com',
      id: 'user-1',
      name: 'テストユーザー',
      updatedAt: new Date(),
    }

    mockUseUserStore.mockReturnValue({
      clearUser: vi.fn(),
      initializeAuth: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
      refreshUser: vi.fn(),
      reset: vi.fn(),
      setUser: vi.fn(),
      updateUser: vi.fn(),
      user: mockUser,
    })

    // Act
    renderWithProvider(<Header />)

    // Assert
    // Avatarコンポーネントが表示され、ユーザー名の最初の文字が表示されている
    expect(screen.getByText('テス')).toBeInTheDocument()
  })

  it('ユーザーが未設定の場合、フォールバック表示する', () => {
    // Arrange
    mockUseUserStore.mockReturnValue({
      clearUser: vi.fn(),
      initializeAuth: vi.fn(),
      isAuthenticated: false,
      isLoading: false,
      refreshUser: vi.fn(),
      reset: vi.fn(),
      setUser: vi.fn(),
      updateUser: vi.fn(),
      user: undefined,
    })

    // Act
    renderWithProvider(<Header />)

    // Assert
    // ユーザーが未設定の場合でもコンポーネントが正常にレンダリングされる
    expect(screen.getByRole('heading', { name: 'To Do' })).toBeInTheDocument()
  })

  it('ユーザー名が空文字列の場合、適切に処理する', () => {
    // Arrange
    const mockUser = {
      createdAt: new Date(),
      email: 'test@example.com',
      id: 'user-1',
      name: '',
      updatedAt: new Date(),
    }

    mockUseUserStore.mockReturnValue({
      clearUser: vi.fn(),
      initializeAuth: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
      refreshUser: vi.fn(),
      reset: vi.fn(),
      setUser: vi.fn(),
      updateUser: vi.fn(),
      user: mockUser,
    })

    // Act
    renderWithProvider(<Header />)

    // Assert
    expect(screen.getByRole('heading', { name: 'To Do' })).toBeInTheDocument()
  })
})
