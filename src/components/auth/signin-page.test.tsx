import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SignInPage } from './signin-page'

import { renderWithProviders } from '@/test-utils'

// next-auth/reactをモック
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

describe('SignInPage', () => {
  it('ページタイトルが正しく表示される', () => {
    // Arrange & Act
    renderWithProviders(<SignInPage />)

    // Assert
    expect(screen.getByText('To Do')).toBeInTheDocument()
  })

  it('説明文が表示される', () => {
    // Arrange & Act
    renderWithProviders(<SignInPage />)

    // Assert
    expect(
      screen.getByText('アカウントでサインインしてタスク管理を始めましょう')
    ).toBeInTheDocument()
  })

  it('3つのOAuthプロバイダーボタンが表示される', () => {
    // Arrange & Act
    renderWithProviders(<SignInPage />)

    // Assert
    expect(
      screen.getByRole('button', { name: /googleでサインイン/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /githubでサインイン/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /microsoftでサインイン/i })
    ).toBeInTheDocument()
  })

  it('利用規約とプライバシーポリシーの注記が表示される', () => {
    // Arrange & Act
    renderWithProviders(<SignInPage />)

    // Assert
    expect(
      screen.getByText(
        /サインインすることで、利用規約とプライバシーポリシーに同意したものとみなされます/
      )
    ).toBeInTheDocument()
  })

  it('すべてのボタンがlgサイズで表示される', () => {
    // Arrange & Act
    renderWithProviders(<SignInPage />)

    // Assert
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)

    // Mantineのsize="lg"のクラスが適用されているかをチェック
    buttons.forEach((button) => {
      expect(button).toHaveClass('mantine-Button-root')
    })
  })

  it('ページが中央配置されている', () => {
    // Arrange & Act
    const { container } = renderWithProviders(<SignInPage />)

    // Assert
    const containerElement = container.querySelector('.mantine-Container-root')
    expect(containerElement).toBeInTheDocument()
  })

  it('カードコンポーネントが境界線付きで表示される', () => {
    // Arrange & Act
    const { container } = renderWithProviders(<SignInPage />)

    // Assert
    const paper = container.querySelector('.mantine-Paper-root')
    expect(paper).toBeInTheDocument()
  })
})
