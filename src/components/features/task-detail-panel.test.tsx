/**
 * TaskDetailPanelコンポーネントのテスト
 * @fileoverview タスク詳細表示パネルのユニットテスト
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TaskDetailPanel } from './task-detail-panel'

import { useTaskStore } from '@/stores/task-store'
import { useUIStore } from '@/stores/ui-store'
import { render, screen } from '@/tests/test-utils'

// モック
vi.mock('@/stores/task-store')
vi.mock('@/stores/ui-store')

const mockUseTaskStore = vi.mocked(useTaskStore)
const mockUseUIStore = vi.mocked(useUIStore)

describe('TaskDetailPanel', () => {
  beforeEach(() => {
    // UIストアのモック
    mockUseUIStore.mockReturnValue({
      isDesktopScreen: () => true,
      isMobileScreen: () => false,
      isSidebarOpen: true,
      isTabletScreen: () => false,
      isTaskDetailPanelOpen: true,
      screenSize: 'desktop',
      setScreenSize: vi.fn(),
      setSidebarOpen: vi.fn(),
      setTaskDetailPanelOpen: vi.fn(),
      toggleSidebar: vi.fn(),
      toggleTaskDetailPanel: vi.fn(),
    })

    // タスクストアのモック
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
  })

  describe('タスクが選択されていない場合', () => {
    it('should show no task selected message when no task is selected', () => {
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
        selectedTask: undefined, // タスクが選択されていない
        setFilter: vi.fn(),
        setSelectedTaskId: vi.fn(),
        toggleTaskCompletion: vi.fn(),
        toggleTaskImportance: vi.fn(),
      })

      render(<TaskDetailPanel />)

      // タスクが選択されていないメッセージが表示される
      expect(screen.getByText('タスクが選択されていません')).toBeInTheDocument()
    })

    it('should not show task detail header when no task is selected', () => {
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

      render(<TaskDetailPanel />)

      // タスク詳細ヘッダーが表示されない
      expect(screen.queryByText('タスク詳細')).not.toBeInTheDocument()
    })
  })

  describe('タスクが選択されている場合', () => {
    const mockTask = {
      completed: false,
      createdAt: new Date('2023-12-01'),
      description: 'テスト用のタスクです',
      dueDate: new Date('2023-12-10'),
      id: 'task-1',
      important: false,
      subtasks: [],
      title: 'テストタスク',
      updatedAt: new Date('2023-12-01'),
      userId: 'user-1',
    }

    it('should show task detail header when task is selected', () => {
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

      render(<TaskDetailPanel />)

      // タスク詳細ヘッダーが表示される
      expect(screen.getByText('タスク詳細')).toBeInTheDocument()
    })

    it('should show task title and description', () => {
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

      render(<TaskDetailPanel />)

      // タスクタイトルと説明が表示される
      expect(screen.getByText('テストタスク')).toBeInTheDocument()
      expect(screen.getByText('テスト用のタスクです')).toBeInTheDocument()
    })

    it('should show due date when present', () => {
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

      render(<TaskDetailPanel />)

      // 期限が表示される
      expect(screen.getByText(/期限:/)).toBeInTheDocument()
    })

    it('should not show description when not present', () => {
      const taskWithoutDescription = {
        ...mockTask,
        description: undefined,
      }

      mockUseTaskStore.mockReturnValue({
        clearSelectedTask: vi.fn(),
        error: undefined,
        filter: 'all',
        filteredTaskCount: 1,
        filteredTasks: [taskWithoutDescription],
        getFilteredTaskCount: () => 1,
        getFilteredTasks: () => [taskWithoutDescription],
        isLoading: false,
        removeTask: vi.fn(),
        selectedTask: taskWithoutDescription,
        setFilter: vi.fn(),
        setSelectedTaskId: vi.fn(),
        toggleTaskCompletion: vi.fn(),
        toggleTaskImportance: vi.fn(),
      })

      render(<TaskDetailPanel />)

      // タスクタイトルは表示される
      expect(screen.getByText('テストタスク')).toBeInTheDocument()

      // 説明は表示されない
      expect(screen.queryByText('テスト用のタスクです')).not.toBeInTheDocument()
    })

    it('should not show due date when not present', () => {
      const taskWithoutDueDate = {
        ...mockTask,
        dueDate: undefined,
      }

      mockUseTaskStore.mockReturnValue({
        clearSelectedTask: vi.fn(),
        error: undefined,
        filter: 'all',
        filteredTaskCount: 1,
        filteredTasks: [taskWithoutDueDate],
        getFilteredTaskCount: () => 1,
        getFilteredTasks: () => [taskWithoutDueDate],
        isLoading: false,
        removeTask: vi.fn(),
        selectedTask: taskWithoutDueDate,
        setFilter: vi.fn(),
        setSelectedTaskId: vi.fn(),
        toggleTaskCompletion: vi.fn(),
        toggleTaskImportance: vi.fn(),
      })

      render(<TaskDetailPanel />)

      // 期限は表示されない
      expect(screen.queryByText(/期限:/)).not.toBeInTheDocument()
    })
  })

  describe('タスクの状態表示', () => {
    it('should show important badge when task is important', () => {
      const importantTask = {
        completed: false,
        createdAt: new Date(),
        description: '重要なタスクです',
        id: 'task-1',
        important: true, // 重要なタスク
        subtasks: [],
        title: '重要なタスク',
        updatedAt: new Date(),
        userId: 'user-1',
      }

      mockUseTaskStore.mockReturnValue({
        clearSelectedTask: vi.fn(),
        error: undefined,
        filter: 'all',
        filteredTaskCount: 1,
        filteredTasks: [importantTask],
        getFilteredTaskCount: () => 1,
        getFilteredTasks: () => [importantTask],
        isLoading: false,
        removeTask: vi.fn(),
        selectedTask: importantTask,
        setFilter: vi.fn(),
        setSelectedTaskId: vi.fn(),
        toggleTaskCompletion: vi.fn(),
        toggleTaskImportance: vi.fn(),
      })

      render(<TaskDetailPanel />)

      // 重要バッジが表示される
      expect(screen.getByText('重要')).toBeInTheDocument()
    })

    it('should show completed badge when task is completed', () => {
      const completedTask = {
        completed: true, // 完了したタスク
        createdAt: new Date(),
        description: '完了したタスクです',
        id: 'task-1',
        important: false,
        subtasks: [],
        title: '完了したタスク',
        updatedAt: new Date(),
        userId: 'user-1',
      }

      mockUseTaskStore.mockReturnValue({
        clearSelectedTask: vi.fn(),
        error: undefined,
        filter: 'all',
        filteredTaskCount: 1,
        filteredTasks: [completedTask],
        getFilteredTaskCount: () => 1,
        getFilteredTasks: () => [completedTask],
        isLoading: false,
        removeTask: vi.fn(),
        selectedTask: completedTask,
        setFilter: vi.fn(),
        setSelectedTaskId: vi.fn(),
        toggleTaskCompletion: vi.fn(),
        toggleTaskImportance: vi.fn(),
      })

      render(<TaskDetailPanel />)

      // 完了済みバッジが表示される
      expect(screen.getByText('完了済み')).toBeInTheDocument()
    })

    it('should show both badges when task is important and completed', () => {
      const importantCompletedTask = {
        completed: true,
        createdAt: new Date(),
        description: '重要で完了したタスクです',
        id: 'task-1',
        important: true,
        subtasks: [],
        title: '重要で完了したタスク',
        updatedAt: new Date(),
        userId: 'user-1',
      }

      mockUseTaskStore.mockReturnValue({
        clearSelectedTask: vi.fn(),
        error: undefined,
        filter: 'all',
        filteredTaskCount: 1,
        filteredTasks: [importantCompletedTask],
        getFilteredTaskCount: () => 1,
        getFilteredTasks: () => [importantCompletedTask],
        isLoading: false,
        removeTask: vi.fn(),
        selectedTask: importantCompletedTask,
        setFilter: vi.fn(),
        setSelectedTaskId: vi.fn(),
        toggleTaskCompletion: vi.fn(),
        toggleTaskImportance: vi.fn(),
      })

      render(<TaskDetailPanel />)

      // 両方のバッジが表示される
      expect(screen.getByText('重要')).toBeInTheDocument()
      expect(screen.getByText('完了済み')).toBeInTheDocument()
    })
  })

  describe('閉じるボタンの動作', () => {
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

    it('should show close button when task is selected', () => {
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

      render(<TaskDetailPanel />)

      // 閉じるボタンが表示される
      expect(screen.getByLabelText('詳細パネルを閉じる')).toBeInTheDocument()
    })

    it('should call clearSelectedTask and setTaskDetailPanelOpen when close button is clicked', () => {
      const mockClearSelectedTask = vi.fn()
      const mockSetTaskDetailPanelOpen = vi.fn()

      mockUseTaskStore.mockReturnValue({
        clearSelectedTask: mockClearSelectedTask,
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

      mockUseUIStore.mockReturnValue({
        isDesktopScreen: () => true,
        isMobileScreen: () => false,
        isSidebarOpen: true,
        isTabletScreen: () => false,
        isTaskDetailPanelOpen: true,
        screenSize: 'desktop',
        setScreenSize: vi.fn(),
        setSidebarOpen: vi.fn(),
        setTaskDetailPanelOpen: mockSetTaskDetailPanelOpen,
        toggleSidebar: vi.fn(),
        toggleTaskDetailPanel: vi.fn(),
      })

      render(<TaskDetailPanel />)

      const closeButton = screen.getByLabelText('詳細パネルを閉じる')
      closeButton.click()

      // clearSelectedTaskとsetTaskDetailPanelOpenが呼ばれることを確認
      expect(mockClearSelectedTask).toHaveBeenCalledTimes(1)
      expect(mockSetTaskDetailPanelOpen).toHaveBeenCalledWith(false)
    })
  })

  describe('ストアとの連携', () => {
    it('should use correct store values', () => {
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

      const mockTaskStoreValues = {
        clearSelectedTask: vi.fn(),
        error: undefined,
        filter: 'all' as const,
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
      }

      const mockUIStoreValues = {
        isDesktopScreen: () => true,
        isMobileScreen: () => false,
        isSidebarOpen: true,
        isTabletScreen: () => false,
        isTaskDetailPanelOpen: true,
        screenSize: 'desktop' as const,
        setScreenSize: vi.fn(),
        setSidebarOpen: vi.fn(),
        setTaskDetailPanelOpen: vi.fn(),
        toggleSidebar: vi.fn(),
        toggleTaskDetailPanel: vi.fn(),
      }

      mockUseTaskStore.mockReturnValue(mockTaskStoreValues)
      mockUseUIStore.mockReturnValue(mockUIStoreValues)

      render(<TaskDetailPanel />)

      // ストアが正しく呼ばれている
      expect(mockUseTaskStore).toHaveBeenCalled()
      expect(mockUseUIStore).toHaveBeenCalled()

      // コンポーネントが正しくレンダリングされている
      expect(screen.getByText('タスク詳細')).toBeInTheDocument()
      expect(screen.getByText('テストタスク')).toBeInTheDocument()
    })
  })
})
