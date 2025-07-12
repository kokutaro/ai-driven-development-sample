import {
  fireEvent,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { UserAvatarMenu } from './user-avatar-menu'

import { renderWithProviders } from '@/test-utils'

// next-auth/reactをモック
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}))

const { signOut } = await import('next-auth/react')
const mockSignOut = vi.mocked(signOut)

describe('UserAvatarMenu', () => {
  const mockUser = {
    createdAt: new Date(),
    email: 'test@example.com',
    id: 'user-1',
    name: 'テスト ユーザー',
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ユーザーが設定されている場合、アバターが表示される', () => {
    // Arrange & Act
    renderWithProviders(
      <UserAvatarMenu avatarName="テユ" avatarSrc={undefined} user={mockUser} />
    )

    // Assert
    expect(screen.getByText('テユ')).toBeInTheDocument()
  })

  it('ユーザー画像が設定されている場合、画像が表示される', () => {
    // Arrange & Act
    renderWithProviders(
      <UserAvatarMenu
        avatarName="テユ"
        avatarSrc="https://example.com/avatar.jpg"
        user={mockUser}
      />
    )

    // Assert
    const avatar = screen.getByRole('img', { hidden: true })
    expect(avatar).toBeInTheDocument()
  })

  it('ユーザーが未設定の場合、デフォルト状態で表示される', () => {
    // Arrange & Act
    renderWithProviders(
      <UserAvatarMenu
        avatarName={undefined}
        avatarSrc={undefined}
        user={undefined}
      />
    )

    // Assert
    // Avatarコンポーネント自体は表示されるはず
    const container = screen.getByTestId('user-avatar-menu')
    expect(container).toBeInTheDocument()
  })

  it('アバターをクリックするとドロップダウンメニューが開く', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(
      <UserAvatarMenu avatarName="テユ" avatarSrc={undefined} user={mockUser} />
    )

    // Act
    const avatar = screen.getByText('テユ')
    await user.click(avatar)

    // Wait for menu to appear
    await screen.findByRole('menu')

    // Assert
    expect(screen.getByText('ログアウト')).toBeInTheDocument()
  })

  it('ドロップダウンメニューに赤文字でログアウトアイコン付きのオプションが表示される', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(
      <UserAvatarMenu avatarName="テユ" avatarSrc={undefined} user={mockUser} />
    )

    // Act
    const avatar = screen.getByText('テユ')
    await user.click(avatar)

    // Wait for menu to appear
    await screen.findByRole('menu')

    // Assert
    const logoutOption = screen.getByText('ログアウト')
    expect(logoutOption).toBeInTheDocument()

    // アイコンが存在することを確認
    const menuItem = logoutOption.closest('[role="menuitem"]')
    const icon = menuItem?.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('ログアウトオプションをクリックすると確認モーダルが表示される', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(
      <UserAvatarMenu avatarName="テユ" avatarSrc={undefined} user={mockUser} />
    )

    // Act
    const avatar = screen.getByText('テユ')
    await user.click(avatar)

    // Wait for menu to appear
    await screen.findByRole('menu')

    const logoutOption = screen.getByText('ログアウト')
    // Use fireEvent for non-visible elements
    fireEvent.click(logoutOption)

    // Assert
    expect(await screen.findByText('ログアウトしますか？')).toBeInTheDocument()
  })

  it('確認モーダルでログアウトを確認するとsignOutが呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(
      <UserAvatarMenu avatarName="テユ" avatarSrc={undefined} user={mockUser} />
    )

    // Act
    const avatar = screen.getByText('テユ')
    await user.click(avatar)

    // Wait for menu to appear
    await screen.findByRole('menu')

    const logoutOption = screen.getByText('ログアウト')
    fireEvent.click(logoutOption)

    const confirmButton = await screen.findByRole('button', {
      name: /ログアウト/i,
    })
    await user.click(confirmButton)

    // Assert
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/auth/signin' })
  })

  it('確認モーダルでキャンセルするとモーダルが閉じる', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(
      <UserAvatarMenu avatarName="テユ" avatarSrc={undefined} user={mockUser} />
    )

    // Act
    const avatar = screen.getByText('テユ')
    await user.click(avatar)

    // Wait for menu to appear
    await screen.findByRole('menu')

    const logoutOption = screen.getByText('ログアウト')
    fireEvent.click(logoutOption)

    const cancelButton = await screen.findByRole('button', {
      name: /キャンセル/i,
    })
    await user.click(cancelButton)

    // Assert - モーダルが削除されるまで待つ
    await waitForElementToBeRemoved(() =>
      screen.queryByText('ログアウトしますか？')
    )
  })

  it('ESCキーでモーダルが閉じる', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(
      <UserAvatarMenu avatarName="テユ" avatarSrc={undefined} user={mockUser} />
    )

    // Act
    const avatar = screen.getByText('テユ')
    await user.click(avatar)

    // Wait for menu to appear
    await screen.findByRole('menu')

    const logoutOption = screen.getByText('ログアウト')
    fireEvent.click(logoutOption)

    // Wait for modal to appear
    await screen.findByText('ログアウトしますか？')

    await user.keyboard('{Escape}')

    // Assert - モーダルが削除されるまで待つ
    await waitForElementToBeRemoved(() =>
      screen.queryByText('ログアウトしますか？')
    )
  })

  it('ドロップダウンメニュー外をクリックするとメニューが閉じる', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(
      <UserAvatarMenu avatarName="テユ" avatarSrc={undefined} user={mockUser} />
    )

    // Act
    const avatar = screen.getByText('テユ')
    await user.click(avatar)

    // Wait for menu to appear
    const menu = await screen.findByRole('menu')

    // メニューが開いていることを確認
    expect(screen.getByText('ログアウト')).toBeInTheDocument()

    // 外部をクリック
    await user.click(document.body)

    // Assert - メニューが削除されるまで待つ
    await waitForElementToBeRemoved(menu)
  })
})
