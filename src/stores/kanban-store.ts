import { create } from 'zustand'

import type {
  CreateKanbanColumnData,
  KanbanColumn,
  UpdateKanbanColumnData,
} from '@/types/todo'

interface KanbanStore {
  // Actions
  clearError: () => void
  createDefaultColumns: () => Promise<void>
  createKanbanColumn: (data: CreateKanbanColumnData) => Promise<void>
  deleteKanbanColumn: (id: string) => Promise<void>

  error: string | undefined
  fetchKanbanColumns: () => Promise<void>
  isLoading: boolean
  kanbanColumns: KanbanColumn[]
  reorderKanbanColumns: (columnIds: string[]) => Promise<void>
  reset: () => void
  updateKanbanColumn: (
    id: string,
    data: UpdateKanbanColumnData
  ) => Promise<void>
}

/**
 * Kanbanカラム状態管理ストア
 *
 * Kanbanカラムの状態とアクションを管理します。
 * - カラムの CRUD 操作
 * - カラムの並び替え
 * - エラー処理
 * - ローディング状態
 */
export const useKanbanStore = create<KanbanStore>((set, get) => ({
  clearError: () => set({ error: undefined }),

  createDefaultColumns: async () => {
    set({ error: undefined, isLoading: true })
    try {
      const response = await fetch('/api/kanban-columns/seed', {
        method: 'POST',
      })
      if (!response.ok) {
        // カラムが既に存在する場合はエラーとしない
        if (response.status === 409) {
          set({ isLoading: false })
          return
        }
        throw new Error('デフォルトKanbanカラムの作成に失敗しました')
      }
      const responseData = await response.json()
      const newColumns = responseData.data
      set({
        isLoading: false,
        kanbanColumns: newColumns.sort(
          (a: KanbanColumn, b: KanbanColumn) => a.order - b.order
        ),
      })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'デフォルトKanbanカラムの作成に失敗しました',
        isLoading: false,
      })
    }
  },
  createKanbanColumn: async (data: CreateKanbanColumnData) => {
    set({ error: undefined, isLoading: true })
    try {
      const response = await fetch('/api/kanban-columns', {
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Kanbanカラムの作成に失敗しました')
      }
      const responseData = await response.json()
      const newColumn = responseData.data
      set((state) => ({
        isLoading: false,
        kanbanColumns: [...state.kanbanColumns, newColumn].sort(
          (a, b) => a.order - b.order
        ),
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Kanbanカラムの作成に失敗しました',
        isLoading: false,
      })
    }
  },
  deleteKanbanColumn: async (id: string) => {
    set({ error: undefined, isLoading: true })
    try {
      const response = await fetch(`/api/kanban-columns/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Kanbanカラムの削除に失敗しました')
      }
      set((state) => ({
        isLoading: false,
        kanbanColumns: state.kanbanColumns.filter((column) => column.id !== id),
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Kanbanカラムの削除に失敗しました',
        isLoading: false,
      })
    }
  },

  error: undefined,

  fetchKanbanColumns: async () => {
    set({ error: undefined, isLoading: true })
    try {
      const response = await fetch('/api/kanban-columns')
      if (!response.ok) {
        throw new Error('Kanbanカラムの取得に失敗しました')
      }
      const data = await response.json()
      set({ isLoading: false, kanbanColumns: data.data })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Kanbanカラムの取得に失敗しました',
        isLoading: false,
      })
    }
  },

  isLoading: false,

  kanbanColumns: [],

  reorderKanbanColumns: async (columnIds: string[]) => {
    const { kanbanColumns } = get()
    // 楽観的更新
    const reorderedColumns = columnIds
      .map((id, index) => {
        const column = kanbanColumns.find((col) => col.id === id)
        return column ? { ...column, order: index + 1 } : undefined
      })
      .filter((column): column is KanbanColumn => column !== undefined)

    set({ kanbanColumns: reorderedColumns })

    try {
      const response = await fetch('/api/kanban-columns/reorder', {
        body: JSON.stringify({ columnIds }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      })
      if (!response.ok) {
        // 失敗時は元に戻す
        set({ kanbanColumns })
        throw new Error('Kanbanカラムの並び替えに失敗しました')
      }
      const responseData = await response.json()
      set({ kanbanColumns: responseData.data.kanbanColumns })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Kanbanカラムの並び替えに失敗しました',
        kanbanColumns,
      })
    }
  },

  reset: () =>
    set({
      error: undefined,
      isLoading: false,
      kanbanColumns: [],
    }),

  updateKanbanColumn: async (id: string, data: UpdateKanbanColumnData) => {
    set({ error: undefined })
    try {
      const response = await fetch(`/api/kanban-columns/${id}`, {
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PUT',
      })
      if (!response.ok) {
        throw new Error('Kanbanカラムの更新に失敗しました')
      }
      const responseData = await response.json()
      const updatedColumn = responseData.data as KanbanColumn
      set((state) => ({
        kanbanColumns: state.kanbanColumns
          .map((column) => (column.id === id ? updatedColumn : column))
          .sort((a, b) => a.order - b.order),
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Kanbanカラムの更新に失敗しました',
      })
    }
  },
}))
