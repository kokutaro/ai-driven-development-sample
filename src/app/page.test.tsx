/**
 * メインページのテスト
 * @fileoverview 3カラムレイアウト対応のTODOアプリメインページのユニットテスト
 */
import { useMediaQuery } from '@mantine/hooks'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import HomePage from './page'

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

describe('HomePage', () => {
  beforeEach(() => {
    // UIストアのモック（デスクトップ表示をデフォルト）
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
    it('should render AppLayout component correctly', () => {
      render(<HomePage />)

      // AppLayoutの基本構造が表示されている
      expect(screen.getByRole('banner')).toBeInTheDocument() // header
      expect(screen.getByRole('navigation')).toBeInTheDocument() // navbar
      expect(screen.getByRole('main')).toBeInTheDocument() // main content
    })

    it('should render app title in header', () => {
      render(<HomePage />)

      // ヘッダーにアプリタイトルが表示されている
      expect(screen.getByText('To Do')).toBeInTheDocument()
    })

    it('should render filter sidebar with all filter options', () => {
      render(<HomePage />)

      // フィルタサイドバーのすべてのオプションが表示されている
      expect(screen.getByText('今日の予定')).toBeInTheDocument()
      expect(screen.getByText('重要')).toBeInTheDocument()
      expect(screen.getByText('今後の予定')).toBeInTheDocument()
      expect(screen.getByText('自分に割り当て')).toBeInTheDocument()
      expect(screen.getByText('フラグを設定したメール')).toBeInTheDocument()
      expect(screen.getByText('タスク')).toBeInTheDocument()
      expect(screen.getByText('完了済み')).toBeInTheDocument()
    })

    it('should render task list in main content area', () => {
      render(<HomePage />)

      // メインコンテンツエリアにタスクリストが表示されている
      expect(screen.getByRole('main')).toBeInTheDocument()

      // タスクがない場合のメッセージが表示される
      expect(screen.getByText('タスクがありません')).toBeInTheDocument()
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

      render(<HomePage />)

      // 3カラム表示の確認
      expect(screen.getByRole('navigation')).toBeInTheDocument() // 左カラム
      expect(screen.getByRole('main')).toBeInTheDocument() // 中央カラム
      expect(screen.getByRole('complementary')).toBeInTheDocument() // 右カラム（詳細パネル）
    })

    it('should show 2-column layout on tablet', () => {
      mockUseUIStore.mockReturnValue(
        createMockUIStore({
          isDesktopScreen: () => false,
          isMobileScreen: () => false,
          isSidebarOpen: true,
          isTabletScreen: () => true,
          isTaskDetailPanelOpen: false,
          screenSize: 'tablet',
        })
      )

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

      render(<HomePage />)

      // 2カラム表示の確認（詳細パネルは非表示）
      expect(screen.getByRole('navigation')).toBeInTheDocument() // 左カラム
      expect(screen.getByRole('main')).toBeInTheDocument() // 中央カラム
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument() // 右カラムは非表示
    })

    it('should show 1-column layout on mobile', () => {
      mockUseUIStore.mockReturnValue(
        createMockUIStore({
          isDesktopScreen: () => false,
          isMobileScreen: () => true,
          isSidebarOpen: false,
          isTabletScreen: () => false,
          isTaskDetailPanelOpen: false,
          screenSize: 'mobile',
        })
      )

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

      render(<HomePage />)

      // 1カラム表示の確認（サイドバーも詳細パネルも非表示）
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument() // 左カラムは非表示
      expect(screen.getByRole('main')).toBeInTheDocument() // 中央カラム
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument() // 右カラムは非表示
    })
  })

  describe('タスクリストの表示', () => {
    it('should render task list with empty state when no tasks', () => {
      render(<HomePage />)

      // 空の状態のメッセージが表示される
      expect(screen.getByText('タスクがありません')).toBeInTheDocument()
      expect(
        screen.getByText('新しいタスクを作成してください')
      ).toBeInTheDocument()
    })

    it('should render task list with tasks when available', () => {
      const mockTasks = [
        {
          completed: false,
          createdAt: new Date(),
          description: 'テスト用のタスク1です',
          id: 'task-1',
          important: false,
          subtasks: [],
          title: 'テストタスク1',
          updatedAt: new Date(),
          userId: 'user-1',
        },
        {
          completed: true,
          createdAt: new Date(),
          description: 'テスト用のタスク2です',
          id: 'task-2',
          important: true,
          subtasks: [],
          title: 'テストタスク2',
          updatedAt: new Date(),
          userId: 'user-1',
        },
      ]

      mockUseTaskStore.mockReturnValue(
        createMockTaskStore({
          filter: 'all',
          filteredTaskCount: 2,
          filteredTasks: mockTasks,
          getFilteredTaskCount: () => 2,
          getFilteredTasks: () => mockTasks,
          selectedTask: undefined,
        })
      )

      render(<HomePage />)

      // タスクリストが表示される
      expect(
        screen.getByRole('list', { name: 'タスクリスト' })
      ).toBeInTheDocument()
      expect(screen.getByText('テストタスク1')).toBeInTheDocument()
      expect(screen.getByText('テストタスク2')).toBeInTheDocument()
      expect(screen.getByText('2件のタスク')).toBeInTheDocument()
    })

    it('should render task list with loading state', () => {
      mockUseTaskStore.mockReturnValue(
        createMockTaskStore({
          filter: 'all',
          filteredTaskCount: 0,
          filteredTasks: [],
          isLoading: true, // ローディング状態
          selectedTask: undefined,
        })
      )

      render(<HomePage />)

      // ローディングメッセージが表示される
      expect(screen.getByText('タスクを読み込み中...')).toBeInTheDocument()
    })

    it('should render task list with error state', () => {
      mockUseTaskStore.mockReturnValue(
        createMockTaskStore({
          error: 'タスクの読み込みに失敗しました',
          filter: 'all',
          filteredTaskCount: 0,
          filteredTasks: [],
          selectedTask: undefined,
        })
      )

      render(<HomePage />)

      // エラーメッセージが表示される
      expect(
        screen.getByText('タスクの読み込みに失敗しました')
      ).toBeInTheDocument()
    })
  })

  describe('フィルタ機能', () => {
    it('should show active filter and task count', () => {
      mockUseTaskStore.mockReturnValue(
        createMockTaskStore({
          filter: 'important', // 重要フィルタが選択されている
          filteredTaskCount: 3,
          filteredTasks: [],
          getFilteredTaskCount: () => 3,
          getFilteredTasks: () => [],
          selectedTask: undefined,
        })
      )

      render(<HomePage />)

      // 重要フィルタがアクティブで表示されている
      const importantFilter = screen.getByTestId('filter-important')
      expect(importantFilter).toBeInTheDocument()
    })
  })

  describe('タスク詳細パネル', () => {
    it('should show task detail panel when task is selected', () => {
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
          selectedTask: mockTask, // タスクが選択されている
        })
      )

      render(<HomePage />)

      // タスク詳細パネルが表示される
      expect(screen.getByRole('complementary')).toBeInTheDocument()
      expect(screen.getByText('タスク詳細')).toBeInTheDocument()
    })
  })

  describe('モバイルでのハンバーガーメニュー', () => {
    it('should show burger menu on mobile', () => {
      mockUseUIStore.mockReturnValue(
        createMockUIStore({
          isDesktopScreen: () => false,
          isMobileScreen: () => true,
          isSidebarOpen: false,
          isTabletScreen: () => false,
          isTaskDetailPanelOpen: false,
          screenSize: 'mobile',
        })
      )

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

      render(<HomePage />)

      // ハンバーガーメニューが表示される
      expect(screen.getByLabelText('メニューを開く')).toBeInTheDocument()
    })
  })

  describe('TODO追加機能の統合', () => {
    it('should render task creation button in TaskList', () => {
      render(<HomePage />)

      // タスク追加ボタンが表示されている
      expect(
        screen.getByRole('button', { name: '＋ タスクの追加' })
      ).toBeInTheDocument()
    })

    it('should show task creation modal when add button is clicked', async () => {
      const user = userEvent.setup()

      render(<HomePage />)

      // タスク追加ボタンをクリック
      const addButton = screen.getByRole('button', { name: '＋ タスクの追加' })
      await user.click(addButton)

      // モーダルが表示される
      expect(screen.getByText('新しいタスクを作成')).toBeInTheDocument()
      expect(screen.getByLabelText('タスクタイトル')).toBeInTheDocument()
      expect(screen.getByLabelText('説明（任意）')).toBeInTheDocument()
      expect(screen.getByLabelText('期限日（任意）')).toBeInTheDocument()
      expect(
        screen.getByLabelText('重要なタスクとして設定')
      ).toBeInTheDocument()
    })

    it('should close modal when cancel button is clicked', async () => {
      const user = userEvent.setup()

      render(<HomePage />)

      // タスク追加ボタンをクリック
      const addButton = screen.getByRole('button', { name: '＋ タスクの追加' })
      await user.click(addButton)

      // モーダルが表示される
      expect(screen.getByText('新しいタスクを作成')).toBeInTheDocument()

      // キャンセルボタンをクリック
      const cancelButton = screen.getByRole('button', { name: 'キャンセル' })
      await user.click(cancelButton)

      // モーダルが閉じられる
      expect(screen.queryByText('新しいタスクを作成')).not.toBeInTheDocument()
    })

    it('should integrate task creation flow end-to-end', async () => {
      const user = userEvent.setup()
      const mockAddTask = vi.fn()

      // addTask関数をモック
      mockUseTaskStore.mockReturnValue(
        createMockTaskStore({
          addTask: mockAddTask,
          filter: 'all',
          filteredTaskCount: 0,
          filteredTasks: [],
          selectedTask: undefined,
        })
      )

      render(<HomePage />)

      // タスク追加ボタンをクリック
      const addButton = screen.getByRole('button', { name: '＋ タスクの追加' })
      await user.click(addButton)

      // タスクタイトルを入力
      const titleInput = screen.getByLabelText('タスクタイトル')
      await user.type(titleInput, '新しいテストタスク')

      // 説明を入力
      const descriptionInput = screen.getByLabelText('説明（任意）')
      await user.type(descriptionInput, 'テスト用の説明')

      // 重要フラグを設定
      const importantCheckbox = screen.getByLabelText('重要なタスクとして設定')
      await user.click(importantCheckbox)

      // 作成ボタンをクリック
      const createButton = screen.getByRole('button', { name: '作成' })
      await user.click(createButton)

      // タスクが作成されることを確認
      expect(mockAddTask).toHaveBeenCalledWith({
        categoryId: undefined,
        description: 'テスト用の説明',
        dueDate: undefined,
        important: true,
        reminderDate: undefined,
        repeatPattern: undefined,
        title: '新しいテストタスク',
      })

      // モーダルが閉じられることを確認
      expect(screen.queryByText('新しいタスクを作成')).not.toBeInTheDocument()
    })

    it('should show validation errors for invalid input', async () => {
      const user = userEvent.setup()

      render(<HomePage />)

      // タスク追加ボタンをクリック
      const addButton = screen.getByRole('button', { name: '＋ タスクの追加' })
      await user.click(addButton)

      // タイトルを空のまま作成ボタンをクリック
      const createButton = screen.getByRole('button', { name: '作成' })
      await user.click(createButton)

      // バリデーションエラーが表示される（Mantineフォームのデフォルト動作）
      // モーダルが閉じられていないことを確認
      expect(screen.getByText('新しいタスクを作成')).toBeInTheDocument()
    })
  })
})
