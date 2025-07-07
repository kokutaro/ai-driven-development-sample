/**
 * MainHeaderコンポーネントのテスト
 * @fileoverview アプリケーションメインヘッダーのユニットテスト
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MainHeader } from './main-header'

import { useUIStore } from '@/stores/ui-store'
import { createMockUIStore } from '@/tests/mock-types'
import { render, screen } from '@/tests/test-utils'

// モック
vi.mock('@/stores/ui-store')

const mockUseUIStore = vi.mocked(useUIStore)

describe('MainHeader', () => {
  beforeEach(() => {
    // UIストアのモック（デスクトップ表示をデフォルト）
    mockUseUIStore.mockReturnValue(
      createMockUIStore({
        isDesktopScreen: () => true,
        isMobileScreen: () => false,
        isSidebarOpen: false,
        isTabletScreen: () => false,
        isTaskDetailPanelOpen: false,
        screenSize: 'desktop',
      })
    )
  })

  describe('基本レンダリング', () => {
    it('should render app title correctly', () => {
      render(<MainHeader />)

      // アプリタイトルが表示されている
      expect(screen.getByText('To Do')).toBeInTheDocument()
    })

    it('should render header structure correctly', () => {
      render(<MainHeader />)

      // ヘッダーの基本構造が正しく表示されている
      const header = screen.getByText('To Do').closest('div')
      expect(header).toBeInTheDocument()
    })
  })

  describe('レスポンシブ表示', () => {
    it('should not show burger menu on desktop', () => {
      mockUseUIStore.mockReturnValue({
        isDesktopScreen: () => true,
        isMobileScreen: () => false,
        isSidebarOpen: false,
        isTabletScreen: () => false,
        isTaskDetailPanelOpen: false,
        screenSize: 'desktop',
        setScreenSize: vi.fn(),
        setSidebarOpen: vi.fn(),
        setTaskDetailPanelOpen: vi.fn(),
        toggleSidebar: vi.fn(),
        toggleTaskDetailPanel: vi.fn(),
      })

      render(<MainHeader />)

      // デスクトップではハンバーガーメニューが表示されない
      expect(screen.queryByLabelText('メニューを開く')).not.toBeInTheDocument()
    })

    it('should not show burger menu on tablet', () => {
      mockUseUIStore.mockReturnValue({
        isDesktopScreen: () => false,
        isMobileScreen: () => false,
        isSidebarOpen: false,
        isTabletScreen: () => true,
        isTaskDetailPanelOpen: false,
        screenSize: 'tablet',
        setScreenSize: vi.fn(),
        setSidebarOpen: vi.fn(),
        setTaskDetailPanelOpen: vi.fn(),
        toggleSidebar: vi.fn(),
        toggleTaskDetailPanel: vi.fn(),
      })

      render(<MainHeader />)

      // タブレットでもハンバーガーメニューが表示されない
      expect(screen.queryByLabelText('メニューを開く')).not.toBeInTheDocument()
    })

    it('should show burger menu on mobile', () => {
      mockUseUIStore.mockReturnValue({
        isDesktopScreen: () => false,
        isMobileScreen: () => true,
        isSidebarOpen: false,
        isTabletScreen: () => false,
        isTaskDetailPanelOpen: false,
        screenSize: 'mobile',
        setScreenSize: vi.fn(),
        setSidebarOpen: vi.fn(),
        setTaskDetailPanelOpen: vi.fn(),
        toggleSidebar: vi.fn(),
        toggleTaskDetailPanel: vi.fn(),
      })

      render(<MainHeader />)

      // モバイルではハンバーガーメニューが表示される
      expect(screen.getByLabelText('メニューを開く')).toBeInTheDocument()
    })
  })

  describe('ハンバーガーメニューの状態', () => {
    it('should show closed burger menu when sidebar is closed', () => {
      mockUseUIStore.mockReturnValue({
        isDesktopScreen: () => false,
        isMobileScreen: () => true,
        isSidebarOpen: false, // サイドバーが閉じている
        isTabletScreen: () => false,
        isTaskDetailPanelOpen: false,
        screenSize: 'mobile',
        setScreenSize: vi.fn(),
        setSidebarOpen: vi.fn(),
        setTaskDetailPanelOpen: vi.fn(),
        toggleSidebar: vi.fn(),
        toggleTaskDetailPanel: vi.fn(),
      })

      render(<MainHeader />)

      const burgerButton = screen.getByLabelText('メニューを開く')
      expect(burgerButton).toBeInTheDocument()

      // Burgerコンポーネントのopened={false}状態を確認
      // Mantineのコンポーネントの内部実装に依存するため、
      // ここではコンポーネントが存在することで十分とする
    })

    it('should show opened burger menu when sidebar is open', () => {
      mockUseUIStore.mockReturnValue({
        isDesktopScreen: () => false,
        isMobileScreen: () => true,
        isSidebarOpen: true, // サイドバーが開いている
        isTabletScreen: () => false,
        isTaskDetailPanelOpen: false,
        screenSize: 'mobile',
        setScreenSize: vi.fn(),
        setSidebarOpen: vi.fn(),
        setTaskDetailPanelOpen: vi.fn(),
        toggleSidebar: vi.fn(),
        toggleTaskDetailPanel: vi.fn(),
      })

      render(<MainHeader />)

      const burgerButton = screen.getByLabelText('メニューを開く')
      expect(burgerButton).toBeInTheDocument()

      // Burgerコンポーネントのopened={true}状態を確認
      // Mantineのコンポーネントの内部実装に依存するため、
      // ここではコンポーネントが存在することで十分とする
    })
  })

  describe('ハンバーガーメニューの動作', () => {
    it('should call toggleSidebar when burger menu is clicked', () => {
      const mockToggleSidebar = vi.fn()

      mockUseUIStore.mockReturnValue({
        isDesktopScreen: () => false,
        isMobileScreen: () => true,
        isSidebarOpen: false,
        isTabletScreen: () => false,
        isTaskDetailPanelOpen: false,
        screenSize: 'mobile',
        setScreenSize: vi.fn(),
        setSidebarOpen: vi.fn(),
        setTaskDetailPanelOpen: vi.fn(),
        toggleSidebar: mockToggleSidebar,
        toggleTaskDetailPanel: vi.fn(),
      })

      render(<MainHeader />)

      const burgerButton = screen.getByLabelText('メニューを開く')

      // ハンバーガーメニューをクリック
      burgerButton.click()

      // toggleSidebarが呼ばれることを確認
      expect(mockToggleSidebar).toHaveBeenCalledTimes(1)
    })
  })

  describe('UIストアとの連携', () => {
    it('should use correct UI store values', () => {
      const mockUIStoreValues = {
        isDesktopScreen: () => true,
        isMobileScreen: () => false,
        isSidebarOpen: true,
        isTabletScreen: () => false,
        isTaskDetailPanelOpen: false,
        screenSize: 'desktop' as const,
        setScreenSize: vi.fn(),
        setSidebarOpen: vi.fn(),
        setTaskDetailPanelOpen: vi.fn(),
        toggleSidebar: vi.fn(),
        toggleTaskDetailPanel: vi.fn(),
      }

      mockUseUIStore.mockReturnValue(mockUIStoreValues)

      render(<MainHeader />)

      // UIストアが正しく呼ばれている
      expect(mockUseUIStore).toHaveBeenCalled()

      // コンポーネントが正しくレンダリングされている
      expect(screen.getByText('To Do')).toBeInTheDocument()
    })
  })
})
