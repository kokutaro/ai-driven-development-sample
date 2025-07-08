import { create } from 'zustand'

import type { KanbanColumn, Todo } from '@/types/todo'

export type ViewMode = 'kanban' | 'list'

interface UIStore {
  reset: () => void
  selectedFilter: string
  selectedKanbanColumn: KanbanColumn | undefined
  selectedTodo: Todo | undefined

  // Actions
  setSelectedFilter: (filter: string) => void
  setSelectedKanbanColumn: (column: KanbanColumn | undefined) => void
  setSelectedTodo: (todo: Todo | undefined) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setViewMode: (mode: ViewMode) => void
  sidebarCollapsed: boolean
  viewMode: ViewMode
}

/**
 * UI状態管理ストア
 *
 * UIの状態を管理します。
 * - フィルタ選択状態
 * - 選択されたタスク
 * - サイドバー表示状態
 * - ビューモード（リスト/Kanban）
 * - 選択されたKanbanカラム
 */
export const useUiStore = create<UIStore>((set) => ({
  reset: () =>
    set({
      selectedFilter: 'all',
      selectedKanbanColumn: undefined,
      selectedTodo: undefined,
      sidebarCollapsed: false,
      viewMode: 'list',
    }),
  selectedFilter: 'all',
  selectedKanbanColumn: undefined,
  selectedTodo: undefined,

  setSelectedFilter: (filter) => set({ selectedFilter: filter }),
  setSelectedKanbanColumn: (column) => set({ selectedKanbanColumn: column }),
  setSelectedTodo: (todo) => set({ selectedTodo: todo }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setViewMode: (mode) => set({ viewMode: mode }),
  sidebarCollapsed: false,
  viewMode: 'list',
}))
