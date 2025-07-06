import { create } from 'zustand'

import type { TodoFilter } from '@/types/filter'

/**
 * TODO UI状態管理を行うストアの型定義
 */
interface TodoUIStore {
  /** 現在選択されているフィルタ */
  currentFilter: TodoFilter

  /** 詳細パネルが表示されているかどうか */
  isDetailPanelVisible: boolean

  /** 現在選択されているTODO ID */
  selectedTodoId: string | undefined

  /** フィルタを設定する */
  setFilter: (filter: TodoFilter) => void

  /** 選択されたTODO IDを設定する */
  setSelectedTodoId: (id: string | undefined) => void
}

/**
 * TODO UI状態を管理するZustandストア
 *
 * @description
 * フィルタリング状態、選択されたTODO、詳細パネルの表示状態などを管理します。
 *
 * @example
 * ```tsx
 * const { currentFilter, setFilter, selectedTodoId, setSelectedTodoId } = useTodoUIStore()
 *
 * // フィルタを変更
 * setFilter('today')
 *
 * // TODOを選択
 * setSelectedTodoId('todo-id-123')
 * ```
 */
export const useTodoUIStore = create<TodoUIStore>((set) => ({
  currentFilter: 'all',
  isDetailPanelVisible: false,
  selectedTodoId: undefined,

  setFilter: (filter: TodoFilter) => {
    set({ currentFilter: filter })
  },

  setSelectedTodoId: (id: string | undefined) => {
    set({
      isDetailPanelVisible: id !== undefined,
      selectedTodoId: id,
    })
  },
}))
