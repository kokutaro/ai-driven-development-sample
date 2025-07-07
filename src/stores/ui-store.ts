import { create } from 'zustand'

import type { Todo } from '@/types/todo'

interface UIStore {
  reset: () => void
  selectedFilter: string
  selectedTodo: Todo | undefined

  // Actions
  setSelectedFilter: (filter: string) => void
  setSelectedTodo: (todo: Todo | undefined) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  sidebarCollapsed: boolean
}

/**
 * UI状態管理ストア
 *
 * UIの状態を管理します。
 * - フィルタ選択状態
 * - 選択されたタスク
 * - サイドバー表示状態
 */
export const useUiStore = create<UIStore>((set) => ({
  reset: () =>
    set({
      selectedFilter: 'all',
      selectedTodo: undefined,
      sidebarCollapsed: false,
    }),
  selectedFilter: 'all',
  selectedTodo: undefined,

  setSelectedFilter: (filter) => set({ selectedFilter: filter }),
  setSelectedTodo: (todo) => set({ selectedTodo: todo }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  sidebarCollapsed: false,
}))
