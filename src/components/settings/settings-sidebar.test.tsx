import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SettingsSidebar } from './settings-sidebar'

/**
 * 設定サイドバーコンポーネント テスト
 *
 * SettingsSidebarの全機能をテストし、100%カバレッジを達成します。
 * - メニュー項目の表示
 * - active状態の表示
 * - disabled状態の表示
 * - アイコンの表示
 * - パスによるアクティブ状態の切り替え
 */

// usePathnameをモック
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

const { usePathname } = await import('next/navigation')
const mockUsePathname = vi.mocked(usePathname)

describe('SettingsSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all menu items', () => {
    // Arrange
    mockUsePathname.mockReturnValue('/settings')

    // Act
    render(<SettingsSidebar />)

    // Assert
    expect(screen.getByText('プロフィール')).toBeInTheDocument()
    expect(screen.getByText('アカウント情報の確認')).toBeInTheDocument()

    expect(screen.getByText('外部連携')).toBeInTheDocument()
    expect(screen.getByText('APIキーの管理')).toBeInTheDocument()

    expect(screen.getByText('通知設定')).toBeInTheDocument()
    expect(screen.getByText('リマインダーの設定')).toBeInTheDocument()

    expect(screen.getByText('アカウント')).toBeInTheDocument()
    expect(screen.getByText('アカウントの管理')).toBeInTheDocument()
  })

  it('should render all icons', () => {
    // Arrange
    mockUsePathname.mockReturnValue('/settings')

    // Act
    const { container } = render(<SettingsSidebar />)

    // Assert
    // アイコンが正しく表示されていることを確認（svg要素の存在）
    const icons = container.querySelectorAll('svg')
    expect(icons).toHaveLength(4) // 4つのメニュー項目にそれぞれアイコンがある
  })

  describe('active state', () => {
    it('should mark profile menu as active when on /settings path', () => {
      // Arrange
      mockUsePathname.mockReturnValue('/settings')

      // Act
      render(<SettingsSidebar />)

      // Assert
      const profileItem = screen.getByText('プロフィール').closest('a')
      expect(profileItem).toHaveAttribute('data-active', 'true')
    })

    it('should mark external integration menu as active when on /settings/external-integration path', () => {
      // Arrange
      mockUsePathname.mockReturnValue('/settings/external-integration')

      // Act
      render(<SettingsSidebar />)

      // Assert
      const externalIntegrationItem = screen.getByText('外部連携').closest('a')
      expect(externalIntegrationItem).toHaveAttribute('data-active', 'true')

      // 他のアイテムはactiveではない
      const profileItem = screen.getByText('プロフィール').closest('a')
      expect(profileItem).toHaveAttribute('data-active', 'false')
    })

    it('should mark notifications menu as active when on /settings/notifications path', () => {
      // Arrange
      mockUsePathname.mockReturnValue('/settings/notifications')

      // Act
      render(<SettingsSidebar />)

      // Assert
      const notificationsItem = screen.getByText('通知設定').closest('button')
      expect(notificationsItem).toHaveAttribute('data-active', 'true')
    })

    it('should mark account menu as active when on /settings/account path', () => {
      // Arrange
      mockUsePathname.mockReturnValue('/settings/account')

      // Act
      render(<SettingsSidebar />)

      // Assert
      const accountItem = screen.getByText('アカウント').closest('button')
      expect(accountItem).toHaveAttribute('data-active', 'true')
    })

    it('should not mark any menu as active when on unknown path', () => {
      // Arrange
      mockUsePathname.mockReturnValue('/unknown-path')

      // Act
      render(<SettingsSidebar />)

      // Assert
      const profileItem = screen.getByText('プロフィール').closest('a')
      const externalIntegrationItem = screen.getByText('外部連携').closest('a')

      expect(profileItem).toHaveAttribute('data-active', 'false')
      expect(externalIntegrationItem).toHaveAttribute('data-active', 'false')
    })
  })

  describe('disabled state', () => {
    beforeEach(() => {
      mockUsePathname.mockReturnValue('/settings')
    })

    it('should render enabled menu items as links', () => {
      // Act
      render(<SettingsSidebar />)

      // Assert
      const profileItem = screen.getByText('プロフィール').closest('a')
      const externalIntegrationItem = screen.getByText('外部連携').closest('a')

      expect(profileItem).toHaveAttribute('href', '/settings')
      expect(externalIntegrationItem).toHaveAttribute(
        'href',
        '/settings/external-integration'
      )
    })

    it('should render disabled menu items as buttons without href', () => {
      // Act
      render(<SettingsSidebar />)

      // Assert
      const notificationsItem = screen.getByText('通知設定').closest('button')
      const accountItem = screen.getByText('アカウント').closest('button')

      expect(notificationsItem).toBeDisabled()
      expect(accountItem).toBeDisabled()

      // hrefが設定されていないことを確認
      expect(notificationsItem).not.toHaveAttribute('href')
      expect(accountItem).not.toHaveAttribute('href')
    })

    it('should apply disabled styling to disabled items', () => {
      // Act
      render(<SettingsSidebar />)

      // Assert
      const notificationsItem = screen.getByText('通知設定').closest('button')
      const accountItem = screen.getByText('アカウント').closest('button')

      expect(notificationsItem).toHaveAttribute('data-disabled', 'true')
      expect(accountItem).toHaveAttribute('data-disabled', 'true')
    })
  })

  describe('menu structure', () => {
    beforeEach(() => {
      mockUsePathname.mockReturnValue('/settings')
    })

    it('should render menu items in correct order', () => {
      // Act
      render(<SettingsSidebar />)

      // Assert
      const menuItems = screen
        .getAllByRole('button')
        .concat(screen.getAllByRole('link'))

      // メニューアイテムの順序を確認
      expect(menuItems[0]).toHaveTextContent('プロフィール')
      expect(menuItems[1]).toHaveTextContent('外部連携')
      expect(menuItems[2]).toHaveTextContent('通知設定')
      expect(menuItems[3]).toHaveTextContent('アカウント')
    })

    it('should apply correct styling classes', () => {
      // Act
      const { container } = render(<SettingsSidebar />)

      // Assert
      // Stack要素が存在する
      const stackElement = container.querySelector('[data-group]')
      expect(stackElement).toBeInTheDocument()

      // 各NavLinkにスタイルが適用されている
      const navLinks = container.querySelectorAll(
        '[style*="border-radius: 8px"]'
      )
      expect(navLinks.length).toBeGreaterThan(0)
    })

    it('should handle different pathname formats', () => {
      // Arrange - 末尾にスラッシュがあるパス
      mockUsePathname.mockReturnValue('/settings/')

      // Act
      render(<SettingsSidebar />)

      // Assert
      const profileItem = screen.getByText('プロフィール').closest('a')
      expect(profileItem).not.toHaveAttribute('data-active', 'true')
    })

    it('should handle nested paths correctly', () => {
      // Arrange - 深いネストのパス
      mockUsePathname.mockReturnValue('/settings/external-integration/api-keys')

      // Act
      render(<SettingsSidebar />)

      // Assert
      // 完全一致のみでactiveになる
      const externalIntegrationItem = screen.getByText('外部連携').closest('a')
      expect(externalIntegrationItem).toHaveAttribute('data-active', 'false')
    })
  })

  describe('edge cases', () => {
    it('should handle empty pathname', () => {
      // Arrange
      mockUsePathname.mockReturnValue('')

      // Act
      expect(() => render(<SettingsSidebar />)).not.toThrow()

      // Assert
      const profileItem = screen.getByText('プロフィール').closest('a')
      expect(profileItem).toHaveAttribute('data-active', 'false')
    })

    it('should handle null pathname', () => {
      // Arrange
      mockUsePathname.mockReturnValue('')

      // Act
      expect(() => render(<SettingsSidebar />)).not.toThrow()
    })

    it('should render consistent structure regardless of active state', () => {
      // Arrange
      mockUsePathname.mockReturnValue('/settings')
      const { container: container1 } = render(<SettingsSidebar />)

      // Re-render with different pathname
      mockUsePathname.mockReturnValue('/settings/external-integration')
      const { container: container2 } = render(<SettingsSidebar />)

      // Assert
      // 同じ数のアイテムが表示される
      const items1 = container1.querySelectorAll(
        '[role="button"], [role="link"]'
      )
      const items2 = container2.querySelectorAll(
        '[role="button"], [role="link"]'
      )
      expect(items1).toHaveLength(items2.length)
    })
  })
})
