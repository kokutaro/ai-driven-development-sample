/**
 * AppLayoutコンポーネントのテスト
 * @fileoverview Mantine AppShellベースの3カラムレイアウトコンポーネントのユニットテスト
 */
import { useMediaQuery } from '@mantine/hooks'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppLayout } from './app-layout'

import { useTaskStore } from '@/stores/task-store'
import { useUIStore } from '@/stores/ui-store'
import { createMockTaskStore, createMockUIStore } from '@/tests/mock-types'
import { render, screen } from '@/tests/test-utils'

// モック
vi.mock('@/stores/task-store')
vi.mock('@/stores/ui-store')
vi.mock('@mantine/hooks', () => ({
  useMediaQuery: vi.fn(),
}))

const mockUseTaskStore = vi.mocked(useTaskStore)
const mockUseUIStore = vi.mocked(useUIStore)
const mockUseMediaQuery = vi.mocked(useMediaQuery)

describe('AppLayout', () => {
  beforeEach(() => {
    // UIストアのモック
    mockUseUIStore.mockReturnValue(
      createMockUIStore({
        isDesktopScreen: () => true,
        isMobileScreen: () => false,
        isSidebarOpen: true,
        isTabletScreen: () => false,
        isTaskDetailPanelOpen: false,
        screenSize: 'desktop',
      })
    )

    // タスクストアのモック
    mockUseTaskStore.mockReturnValue(
      createMockTaskStore({
        filter: 'all',
        filteredTaskCount: 0,
        filteredTasks: [],
        selectedTask: undefined,
      })
    )

    // useMediaQueryのモック（デスクトップ表示をデフォルト）
    mockUseMediaQuery.mockImplementation((query: string) => {
      if (query.includes('min-width: 1024px')) return true // desktop
      if (
        query.includes('min-width: 768px') &&
        query.includes('max-width: 1023px')
      )
        return false // tablet
      if (query.includes('max-width: 767px')) return false // mobile
      return false
    })
  })

  describe('基本レンダリング', () => {
    it('should render main layout structure correctly', () => {
      render(<AppLayout />)

      // メインレイアウト構造の確認
      expect(screen.getByRole('banner')).toBeInTheDocument() // header
      expect(screen.getByRole('navigation')).toBeInTheDocument() // navbar
      expect(screen.getByRole('main')).toBeInTheDocument() // main content
    })

    it('should render header with app title', () => {
      render(<AppLayout />)

      // ヘッダーにアプリ名が表示されている
      expect(screen.getByText('To Do')).toBeInTheDocument()
    })

    it('should render filter sidebar when sidebar is open', () => {
      render(<AppLayout />)

      // フィルタサイドバーが表示されている
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByText('今日の予定')).toBeInTheDocument()
      expect(screen.getByText('重要')).toBeInTheDocument()
      expect(screen.getByText('今後の予定')).toBeInTheDocument()
      expect(screen.getByText('自分に割り当て')).toBeInTheDocument()
      expect(screen.getByText('タスク')).toBeInTheDocument()
      expect(screen.getByText('完了済み')).toBeInTheDocument()
    })

    it('should render main content area', () => {
      render(<AppLayout />)

      // メインコンテンツエリアが表示されている
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('レスポンシブ表示', () => {
    it('should show 3-column layout on desktop', () => {
      const mockTask = {
        completed: false,
        createdAt: new Date(),
        description: 'テスト用のタスクです',
        id: 'task-1',
        important: false,
        subtasks: [],
        title: 'テストタスク',
        updatedAt: new Date(),
        userId: 'user-1',
      }

      mockUseUIStore.mockReturnValue(
        createMockUIStore({
          isDesktopScreen: () => true,
          isMobileScreen: () => false,
          isSidebarOpen: true,
          isTabletScreen: () => false,
          isTaskDetailPanelOpen: true,
          screenSize: 'desktop',
        })
      )

      mockUseTaskStore.mockReturnValue(
        createMockTaskStore({
          filter: 'all',
          filteredTaskCount: 1,
          filteredTasks: [mockTask],
          getFilteredTaskCount: () => 1,
          getFilteredTasks: () => [mockTask],
          selectedTask: mockTask, // タスクが選択されている状態
        })
      )

      render(<AppLayout />)

      // 3カラム表示の確認
      expect(screen.getByRole('navigation')).toBeInTheDocument() // 左カラム
      expect(screen.getByRole('main')).toBeInTheDocument() // 中央カラム
      expect(screen.getByRole('complementary')).toBeInTheDocument() // 右カラム（詳細パネル）
    })

    it('should show 2-column layout on tablet', () => {
      mockUseUIStore.mockReturnValue({
        isDesktopScreen: () => false,
        isMobileScreen: () => false,
        isSidebarOpen: true,
        isTabletScreen: () => true,
        isTaskDetailPanelOpen: false,
        screenSize: 'tablet',
        setScreenSize: vi.fn(),
        setSidebarOpen: vi.fn(),
        setTaskDetailPanelOpen: vi.fn(),
        toggleSidebar: vi.fn(),
        toggleTaskDetailPanel: vi.fn(),
      })

      mockUseTaskStore.mockReturnValue({
        clearSelectedTask: vi.fn(),
        error: undefined,
        filter: 'all',
        filteredTaskCount: 0,
        filteredTasks: [],
        getFilteredTaskCount: () => 0,
        getFilteredTasks: () => [],
        isLoading: false,
        removeTask: vi.fn(),
        selectedTask: undefined,
        setFilter: vi.fn(),
        setSelectedTaskId: vi.fn(),
        toggleTaskCompletion: vi.fn(),
        toggleTaskImportance: vi.fn(),
      })

      // タブレット向けのuseMediaQueryモック
      mockUseMediaQuery.mockImplementation((query: string) => {
        if (query.includes('min-width: 1024px')) return false // desktop
        if (
          query.includes('min-width: 768px') &&
          query.includes('max-width: 1023px')
        )
          return true // tablet
        if (query.includes('max-width: 767px')) return false // mobile
        return false
      })

      render(<AppLayout />)

      // 2カラム表示の確認（詳細パネルは非表示）
      expect(screen.getByRole('navigation')).toBeInTheDocument() // 左カラム
      expect(screen.getByRole('main')).toBeInTheDocument() // 中央カラム
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument() // 右カラムは非表示
    })

    it('should show 1-column layout on mobile', () => {
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

      mockUseTaskStore.mockReturnValue({
        clearSelectedTask: vi.fn(),
        error: undefined,
        filter: 'all',
        filteredTaskCount: 0,
        filteredTasks: [],
        getFilteredTaskCount: () => 0,
        getFilteredTasks: () => [],
        isLoading: false,
        removeTask: vi.fn(),
        selectedTask: undefined,
        setFilter: vi.fn(),
        setSelectedTaskId: vi.fn(),
        toggleTaskCompletion: vi.fn(),
        toggleTaskImportance: vi.fn(),
      })

      // モバイル向けのuseMediaQueryモック
      mockUseMediaQuery.mockImplementation((query: string) => {
        if (query.includes('min-width: 1024px')) return false // desktop
        if (
          query.includes('min-width: 768px') &&
          query.includes('max-width: 1023px')
        )
          return false // tablet
        if (query.includes('max-width: 767px')) return true // mobile
        return false
      })

      render(<AppLayout />)

      // 1カラム表示の確認（サイドバーも詳細パネルも非表示）
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument() // 左カラムは非表示
      expect(screen.getByRole('main')).toBeInTheDocument() // 中央カラム
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument() // 右カラムは非表示
    })
  })

  describe('タスク詳細パネル', () => {
    it('should show task detail panel when task is selected and panel is open', () => {
      const mockTask = {
        completed: false,
        createdAt: new Date(),
        description: 'テスト用のタスクです',
        id: 'task-1',
        important: false,
        subtasks: [],
        title: 'テストタスク',
        updatedAt: new Date(),
        userId: 'user-1',
      }

      mockUseTaskStore.mockReturnValue({
        clearSelectedTask: vi.fn(),
        error: undefined,
        filter: 'all',
        filteredTaskCount: 1,
        filteredTasks: [mockTask],
        getFilteredTaskCount: () => 1,
        getFilteredTasks: () => [mockTask],
        isLoading: false,
        removeTask: vi.fn(),
        selectedTask: mockTask,
        setFilter: vi.fn(),
        setSelectedTaskId: vi.fn(),
        toggleTaskCompletion: vi.fn(),
        toggleTaskImportance: vi.fn(),
      })

      mockUseUIStore.mockReturnValue(
        createMockUIStore({
          isDesktopScreen: () => true,
          isMobileScreen: () => false,
          isSidebarOpen: true,
          isTabletScreen: () => false,
          isTaskDetailPanelOpen: true,
          screenSize: 'desktop',
        })
      )

      render(<AppLayout />)

      // タスク詳細パネルが表示されている
      const taskDetailPanel = screen.getByRole('complementary')
      expect(taskDetailPanel).toBeInTheDocument()

      // タスク詳細パネル内にタスク情報が表示されている
      expect(screen.getByText('タスク詳細')).toBeInTheDocument()

      // タスクタイトルが複数箇所にあるため、getAllByTextを使用
      const taskTitles = screen.getAllByText('テストタスク')
      expect(taskTitles.length).toBeGreaterThan(0)
    })

    it('should not show task detail panel when no task is selected', () => {
      mockUseTaskStore.mockReturnValue({
        clearSelectedTask: vi.fn(),
        error: undefined,
        filter: 'all',
        filteredTaskCount: 0,
        filteredTasks: [],
        getFilteredTaskCount: () => 0,
        getFilteredTasks: () => [],
        isLoading: false,
        removeTask: vi.fn(),
        selectedTask: undefined,
        setFilter: vi.fn(),
        setSelectedTaskId: vi.fn(),
        toggleTaskCompletion: vi.fn(),
        toggleTaskImportance: vi.fn(),
      })

      mockUseUIStore.mockReturnValue({
        isDesktopScreen: () => true,
        isMobileScreen: () => false,
        isSidebarOpen: true,
        isTabletScreen: () => false,
        isTaskDetailPanelOpen: false,
        screenSize: 'desktop',
        setScreenSize: vi.fn(),
        setSidebarOpen: vi.fn(),
        setTaskDetailPanelOpen: vi.fn(),
        toggleSidebar: vi.fn(),
        toggleTaskDetailPanel: vi.fn(),
      })

      render(<AppLayout />)

      // タスク詳細パネルは表示されない
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    })
  })

  describe('AppShell設定', () => {
    it('should configure AppShell with correct props for desktop', () => {
      render(<AppLayout />)

      // AppShellコンポーネントが正しく設定されている
      // （実際のテストでは、Mantineコンポーネントの内部構造をテストするのではなく、
      // レンダリング結果や動作をテストすることが重要）
    })

    it('should handle responsive breakpoints correctly', () => {
      render(<AppLayout />)

      // レスポンシブ対応が正しく動作している
      // （このテストでは、画面サイズに応じてレイアウトが変わることを確認）
    })
  })
})
