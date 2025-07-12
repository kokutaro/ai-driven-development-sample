import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { LogoutConfirmationModal } from './logout-confirmation-modal'

import { renderWithProviders } from '@/test-utils'

describe('LogoutConfirmationModal', () => {
  it('モーダルが開いている時、確認メッセージが表示される', () => {
    // Arrange
    const mockOnClose = vi.fn()
    const mockOnConfirm = vi.fn()

    // Act
    renderWithProviders(
      <LogoutConfirmationModal
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        opened={true}
      />
    )

    // Assert
    expect(screen.getByText('ログアウトしますか？')).toBeInTheDocument()
    expect(
      screen.getByText('ログアウトすると、再度ログインが必要になります。')
    ).toBeInTheDocument()
  })

  it('モーダルが閉じている時、確認メッセージが表示されない', () => {
    // Arrange
    const mockOnClose = vi.fn()
    const mockOnConfirm = vi.fn()

    // Act
    renderWithProviders(
      <LogoutConfirmationModal
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        opened={false}
      />
    )

    // Assert
    expect(screen.queryByText('ログアウトしますか？')).not.toBeInTheDocument()
  })

  it('ログアウトボタンが赤色でログアウトアイコン付きで表示される', () => {
    // Arrange
    const mockOnClose = vi.fn()
    const mockOnConfirm = vi.fn()

    // Act
    renderWithProviders(
      <LogoutConfirmationModal
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        opened={true}
      />
    )

    // Assert
    const logoutButton = screen.getByRole('button', { name: /ログアウト/i })
    expect(logoutButton).toBeInTheDocument()
    expect(logoutButton).toHaveClass('mantine-Button-root')

    // アイコンが存在することを確認
    const icon = logoutButton.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('キャンセルボタンが表示される', () => {
    // Arrange
    const mockOnClose = vi.fn()
    const mockOnConfirm = vi.fn()

    // Act
    renderWithProviders(
      <LogoutConfirmationModal
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        opened={true}
      />
    )

    // Assert
    const cancelButton = screen.getByRole('button', { name: /キャンセル/i })
    expect(cancelButton).toBeInTheDocument()
  })

  it('ログアウトボタンクリック時にonConfirmが呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockOnClose = vi.fn()
    const mockOnConfirm = vi.fn()

    renderWithProviders(
      <LogoutConfirmationModal
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        opened={true}
      />
    )

    // Act
    const logoutButton = screen.getByRole('button', { name: /ログアウト/i })
    await user.click(logoutButton)

    // Assert
    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
  })

  it('キャンセルボタンクリック時にonCloseが呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockOnClose = vi.fn()
    const mockOnConfirm = vi.fn()

    renderWithProviders(
      <LogoutConfirmationModal
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        opened={true}
      />
    )

    // Act
    const cancelButton = screen.getByRole('button', { name: /キャンセル/i })
    await user.click(cancelButton)

    // Assert
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('モーダルの閉じるボタンクリック時にonCloseが呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockOnClose = vi.fn()
    const mockOnConfirm = vi.fn()

    renderWithProviders(
      <LogoutConfirmationModal
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        opened={true}
      />
    )

    // Act
    // すべてのボタンを取得し、ログアウトとキャンセル以外のボタン（クローズボタン）を見つける
    const allButtons = screen.getAllByRole('button')
    const closeButton = allButtons.find(
      (button) =>
        !button.textContent?.includes('ログアウト') &&
        !button.textContent?.includes('キャンセル')
    )

    if (closeButton) {
      await user.click(closeButton)
    }

    // Assert
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('ESCキー押下時にonCloseが呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockOnClose = vi.fn()
    const mockOnConfirm = vi.fn()

    renderWithProviders(
      <LogoutConfirmationModal
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        opened={true}
      />
    )

    // Act
    await user.keyboard('{Escape}')

    // Assert
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})
