/**
 * テスト用モック型定義
 * @fileoverview テストファイルで使用するモック型の定義
 */
import { vi } from 'vitest'

import type { TaskStore } from '@/stores/task-store'
import type { UIStore } from '@/stores/ui-store'

/**
 * TaskStoreのモック型
 */
export type MockTaskStore = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof TaskStore]: TaskStore[K] extends (...args: any[]) => any
    ? ReturnType<typeof vi.fn>
    : TaskStore[K]
}

/**
 * UIStoreのモック型
 */
export type MockUIStore = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof UIStore]: UIStore[K] extends (...args: any[]) => any
    ? ReturnType<typeof vi.fn>
    : UIStore[K]
}

/**
 * TaskStoreのモックファクトリー
 * @param overrides 上書きするプロパティ
 * @returns TaskStoreのモック
 */
export function createMockTaskStore(
  overrides: Partial<TaskStore> = {}
): MockTaskStore {
  return {
    // Actions
    addTask: vi.fn(),
    clearError: vi.fn(),
    clearSelectedTask: vi.fn(),
    // State
    error: undefined,
    filter: 'all',
    // Computed
    filteredTaskCount: 0,

    filteredTasks: [],
    // Computed functions
    getFilteredTaskCount: vi.fn(() => 0),

    getFilteredTasks: vi.fn(() => []),
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    getSelectedTask: vi.fn(() => {}),
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    getTaskById: vi.fn(() => {}),
    isLoading: false,
    removeTask: vi.fn(),
    selectedTask: undefined,
    selectedTaskId: undefined,
    setError: vi.fn(),
    setFilter: vi.fn(),
    setSelectedTaskId: vi.fn(),
    setSortOrder: vi.fn(),
    sortOrder: 'createdAt',

    tasks: [],
    toggleTaskCompletion: vi.fn(),
    toggleTaskImportance: vi.fn(),
    updateTask: vi.fn(),

    ...overrides,
  } as MockTaskStore
}

/**
 * UIStoreのモックファクトリー
 * @param overrides 上書きするプロパティ
 * @returns UIStoreのモック
 */
export function createMockUIStore(
  overrides: Partial<UIStore> = {}
): MockUIStore {
  return {
    // Actions
    addNotification: vi.fn(),
    clearAllOperationLoading: vi.fn(),
    clearNotifications: vi.fn(),
    closeAllModals: vi.fn(),
    closeModal: vi.fn(),
    // Computed
    isAnyModalOpen: vi.fn(() => false),
    isDarkTheme: vi.fn(() => false),
    isDesktopScreen: vi.fn(() => true),
    // State
    isFilterPanelOpen: false,

    isGlobalLoading: false,
    isMobileScreen: vi.fn(() => false),
    isOperationLoading: vi.fn(() => false),
    isSidebarOpen: true,
    isTabletScreen: vi.fn(() => false),
    isTaskDetailPanelOpen: false,
    loadingOperations: {},
    modals: {},
    notifications: [],
    openModal: vi.fn(),
    removeNotification: vi.fn(),
    screenSize: 'desktop',
    setFilterPanelOpen: vi.fn(),
    setGlobalLoading: vi.fn(),
    setOperationLoading: vi.fn(),
    setScreenSize: vi.fn(),
    setSidebarOpen: vi.fn(),
    setTaskDetailPanelOpen: vi.fn(),

    setTheme: vi.fn(),
    theme: 'light',
    toggleFilterPanel: vi.fn(),
    toggleSidebar: vi.fn(),
    toggleTaskDetailPanel: vi.fn(),
    toggleTheme: vi.fn(),

    ...overrides,
  } as MockUIStore
}
