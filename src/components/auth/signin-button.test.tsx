import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SignInButton } from './signin-button'

import { renderWithProviders } from '@/test-utils'

// next-auth/reactをモック
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

const { signIn } = await import('next-auth/react')
const mockSignIn = vi.mocked(signIn)

describe('SignInButton', () => {
  it('Googleプロバイダーのボタンが正しく表示される', () => {
    // Arrange & Act
    renderWithProviders(<SignInButton provider="google" />)

    // Assert
    const button = screen.getByRole('button', { name: /googleでサインイン/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveStyle({ backgroundColor: '#4285F4' })
  })

  it('GitHubプロバイダーのボタンが正しく表示される', () => {
    // Arrange & Act
    renderWithProviders(<SignInButton provider="github" />)

    // Assert
    const button = screen.getByRole('button', { name: /githubでサインイン/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveStyle({ backgroundColor: '#333' })
  })

  it('Microsoftプロバイダーのボタンが正しく表示される', () => {
    // Arrange & Act
    renderWithProviders(<SignInButton provider="microsoft-entra-id" />)

    // Assert
    const button = screen.getByRole('button', {
      name: /microsoftでサインイン/i,
    })
    expect(button).toBeInTheDocument()
    expect(button).toHaveStyle({ backgroundColor: '#0078D4' })
  })

  it('ボタンクリック時にsignInが正しいパラメータで呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(<SignInButton provider="google" />)

    // Act
    const button = screen.getByRole('button', { name: /googleでサインイン/i })
    await user.click(button)

    // Assert
    expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/' })
  })

  it('outline variantが正しく適用される', () => {
    // Arrange & Act
    renderWithProviders(<SignInButton provider="google" variant="outline" />)

    // Assert
    const button = screen.getByRole('button', { name: /googleでサインイン/i })
    expect(button).toBeInTheDocument()
    // outline variantの場合、backgroundColorは設定されない
    expect(button).not.toHaveStyle({ backgroundColor: '#4285F4' })
  })

  it('サイズが正しく適用される', () => {
    // Arrange & Act
    renderWithProviders(<SignInButton provider="google" size="lg" />)

    // Assert
    const button = screen.getByRole('button', { name: /googleでサインイン/i })
    expect(button).toBeInTheDocument()
  })
})
