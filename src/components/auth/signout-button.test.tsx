import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SignOutButton } from './signout-button'

import { renderWithProviders } from '@/test-utils'

// next-auth/reactをモック
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}))

const { signOut } = await import('next-auth/react')
const mockSignOut = vi.mocked(signOut)

describe('SignOutButton', () => {
  it('サインアウトボタンが正しく表示される', () => {
    // Arrange & Act
    renderWithProviders(<SignOutButton />)

    // Assert
    const button = screen.getByRole('button', { name: /サインアウト/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('mantine-Button-root')
  })

  it('カスタムテキストが表示される', () => {
    // Arrange & Act
    renderWithProviders(<SignOutButton>ログアウト</SignOutButton>)

    // Assert
    const button = screen.getByRole('button', { name: /ログアウト/i })
    expect(button).toBeInTheDocument()
  })

  it('ボタンクリック時にsignOutがデフォルトのcallbackUrlで呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(<SignOutButton />)

    // Act
    const button = screen.getByRole('button', { name: /サインアウト/i })
    await user.click(button)

    // Assert
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/auth/signin' })
  })

  it('カスタムcallbackUrlが正しく使用される', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(<SignOutButton callbackUrl="/custom-page" />)

    // Act
    const button = screen.getByRole('button', { name: /サインアウト/i })
    await user.click(button)

    // Assert
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/custom-page' })
  })

  it('追加のpropsが正しく適用される', () => {
    // Arrange & Act
    renderWithProviders(<SignOutButton disabled size="lg" />)

    // Assert
    const button = screen.getByRole('button', { name: /サインアウト/i })
    expect(button).toBeDisabled()
  })

  it('アイコンが表示される', () => {
    // Arrange & Act
    renderWithProviders(<SignOutButton />)

    // Assert
    const button = screen.getByRole('button', { name: /サインアウト/i })
    const icon = button.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })
})
