import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import { AuthProvider } from './auth-provider'

import type { Session } from 'next-auth'

// SessionProviderをモック化
vi.mock('next-auth/react', () => ({
  SessionProvider: ({
    children,
    session,
  }: {
    children: React.ReactNode
    session?: null | Session
  }) => (
    <div
      data-session={
        session === undefined ? 'undefined' : JSON.stringify(session)
      }
      data-testid="session-provider"
    >
      {children}
    </div>
  ),
}))

describe('AuthProvider', () => {
  // 基本的なレンダリングテスト（sessionプロパティあり）
  it('renders with session prop', () => {
    // Arrange
    const mockSession: Session = {
      expires: '2024-12-31T23:59:59.999Z',
      user: {
        email: 'test@example.com',
        id: 'user_123',
        name: 'テストユーザー',
      },
    }

    // Act
    render(
      <AuthProvider session={mockSession}>
        <div data-testid="child-content">テストコンテンツ</div>
      </AuthProvider>
    )

    // Assert
    expect(screen.getByTestId('session-provider')).toBeInTheDocument()
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
  })

  // 基本的なレンダリングテスト（sessionプロパティがnull）
  it('renders without session prop (null)', () => {
    // Arrange & Act
    render(
      <AuthProvider session={null}>
        <div data-testid="child-content">テストコンテンツ</div>
      </AuthProvider>
    )

    // Assert
    expect(screen.getByTestId('session-provider')).toBeInTheDocument()
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
  })

  // 基本的なレンダリングテスト（sessionプロパティがundefined）
  it('renders without session prop (undefined)', () => {
    // Arrange & Act
    render(
      <AuthProvider>
        <div data-testid="child-content">テストコンテンツ</div>
      </AuthProvider>
    )

    // Assert
    expect(screen.getByTestId('session-provider')).toBeInTheDocument()
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
  })

  // childrenプロパティが正しくレンダリングされることをテスト
  it('properly renders children prop', () => {
    // Arrange
    const childContent = 'これは子コンポーネントです'

    // Act
    render(
      <AuthProvider>
        <p data-testid="paragraph">{childContent}</p>
        <button data-testid="button">クリック</button>
        <span data-testid="span">スパン要素</span>
      </AuthProvider>
    )

    // Assert
    expect(screen.getByTestId('paragraph')).toHaveTextContent(childContent)
    expect(screen.getByTestId('button')).toBeInTheDocument()
    expect(screen.getByTestId('span')).toBeInTheDocument()
  })

  // SessionProviderが正しいsessionプロパティを受け取ることをテスト
  it('SessionProvider receives the correct session prop when session is provided', () => {
    // Arrange
    const mockSession: Session = {
      expires: '2024-06-30T23:59:59.999Z',
      user: {
        email: 'yamada@example.com',
        id: 'user_456',
        name: '山田太郎',
      },
    }

    // Act
    render(
      <AuthProvider session={mockSession}>
        <div>テスト</div>
      </AuthProvider>
    )

    // Assert
    const sessionProvider = screen.getByTestId('session-provider')
    expect(sessionProvider).toHaveAttribute(
      'data-session',
      JSON.stringify(mockSession)
    )
  })

  // SessionProviderが正しいsessionプロパティを受け取ることをテスト（nullの場合）
  it('SessionProvider receives the correct session prop when session is null', () => {
    // Arrange & Act
    render(
      <AuthProvider session={null}>
        <div>テスト</div>
      </AuthProvider>
    )

    // Assert
    const sessionProvider = screen.getByTestId('session-provider')
    expect(sessionProvider).toHaveAttribute('data-session', 'null')
  })

  // SessionProviderが正しいsessionプロパティを受け取ることをテスト（undefinedの場合）
  it('SessionProvider receives the correct session prop when session is undefined', () => {
    // Arrange & Act
    render(
      <AuthProvider>
        <div>テスト</div>
      </AuthProvider>
    )

    // Assert
    const sessionProvider = screen.getByTestId('session-provider')
    expect(sessionProvider).toHaveAttribute('data-session', 'undefined')
  })

  // 複雑なセッションデータの場合のテスト
  it('handles complex session data correctly', () => {
    // Arrange
    const complexSession: Session = {
      expires: '2024-12-31T23:59:59.999Z',
      user: {
        email: 'tanaka@example.com',
        id: 'user_789',
        image: 'https://example.com/avatar.jpg',
        name: '田中花子',
      },
    }

    // Act
    render(
      <AuthProvider session={complexSession}>
        <div data-testid="complex-content">複雑なセッションデータテスト</div>
      </AuthProvider>
    )

    // Assert
    const sessionProvider = screen.getByTestId('session-provider')
    expect(sessionProvider).toHaveAttribute(
      'data-session',
      JSON.stringify(complexSession)
    )
    expect(screen.getByTestId('complex-content')).toBeInTheDocument()
  })

  // 複数の子要素が正しくレンダリングされることをテスト
  it('renders multiple children correctly', () => {
    // Arrange
    const mockSession: Session = {
      expires: '2024-12-31T23:59:59.999Z',
      user: {
        email: 'multi@example.com',
        id: 'user_multi',
        name: 'マルチユーザー',
      },
    }

    // Act
    render(
      <AuthProvider session={mockSession}>
        <header data-testid="header">ヘッダー</header>
        <main data-testid="main">
          <section data-testid="section">セクション</section>
          <article data-testid="article">記事</article>
        </main>
        <footer data-testid="footer">フッター</footer>
      </AuthProvider>
    )

    // Assert
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('main')).toBeInTheDocument()
    expect(screen.getByTestId('section')).toBeInTheDocument()
    expect(screen.getByTestId('article')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  // 空のchildren要素の場合のテスト
  it('handles empty children gracefully', () => {
    // Arrange & Act
    render(<AuthProvider session={null}>{null}</AuthProvider>)

    // Assert
    expect(screen.getByTestId('session-provider')).toBeInTheDocument()
  })

  // 文字列のchildrenの場合のテスト
  it('renders string children correctly', () => {
    // Arrange
    const textContent = 'これは文字列の子要素です'

    // Act
    render(<AuthProvider session={null}>{textContent}</AuthProvider>)

    // Assert
    expect(screen.getByText(textContent)).toBeInTheDocument()
  })
})
