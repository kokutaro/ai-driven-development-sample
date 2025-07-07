import { create } from 'zustand'

import type { Todo, UpdateTodoApiData } from '@/types/todo'

import { todoClient } from '@/lib/api/todo-client'

interface TodoStore {
  clearError: () => void
  createTodo: (data: Partial<Todo>) => Promise<void>
  deleteTodo: (id: string) => Promise<void>

  error: string | undefined
  // Actions
  fetchTodos: (filter?: string) => Promise<void>
  isLoading: boolean
  reset: () => void
  todos: Todo[]
  toggleTodo: (id: string) => Promise<void>
  updateTodo: (id: string, data: UpdateTodoApiData) => Promise<void>
}

/**
 * TODO状態管理ストア
 *
 * TODOの状態とアクションを管理します。
 * - タスクの CRUD 操作
 * - フィルタリング
 * - エラー処理
 * - ローディング状態
 */
export const useTodoStore = create<TodoStore>((set, get) => ({
  clearError: () => set({ error: undefined }),
  createTodo: async (data) => {
    set({ error: undefined, isLoading: true })
    try {
      const newTodo = await todoClient.createTodo(data)

      // 新しいtodoの妥当性を検証
      if (!newTodo || typeof newTodo.id !== 'string' || !newTodo.title) {
        throw new Error('APIから無効なtodoデータが返されました')
      }

      set((state) => ({
        isLoading: false,
        todos: [newTodo, ...state.todos],
      }))
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'タスクの作成に失敗しました'
      set({ error: errorMessage, isLoading: false })
    }
  },
  deleteTodo: async (id) => {
    set({ error: undefined, isLoading: true })
    try {
      await todoClient.deleteTodo(id)
      set((state) => ({
        isLoading: false,
        todos: state.todos.filter((todo) => todo.id !== id),
      }))
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'タスクの削除に失敗しました'
      set({ error: errorMessage, isLoading: false })
    }
  },

  error: undefined,

  fetchTodos: async (filter = 'all') => {
    set({ error: undefined, isLoading: true })
    try {
      const response = await todoClient.getTodos({ filter })
      const todos = response.todos || []

      // todos配列の各要素の妥当性を検証
      const validTodos = todos.filter(
        (todo) => todo && typeof todo.id === 'string' && todo.title
      )

      set({ isLoading: false, todos: validTodos })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'タスクの取得に失敗しました'
      set({ error: errorMessage, isLoading: false })
    }
  },

  isLoading: false,

  reset: () =>
    set({
      error: undefined,
      isLoading: false,
      todos: [],
    }),

  todos: [],

  toggleTodo: async (id) => {
    const todo = get().todos.find((t) => t.id === id)
    if (!todo) return

    try {
      await todoClient.toggleTodo(id)
      set((state) => ({
        todos: state.todos.map((t) =>
          t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
        ),
      }))
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'タスクの状態更新に失敗しました'
      set({ error: errorMessage })
    }
  },

  updateTodo: async (id, data) => {
    try {
      const updatedTodo = await todoClient.updateTodo(id, data)

      // 更新されたtodoの妥当性を検証
      if (
        !updatedTodo ||
        typeof updatedTodo.id !== 'string' ||
        !updatedTodo.title
      ) {
        throw new Error('APIから無効なtodoデータが返されました')
      }

      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === id ? { ...todo, ...updatedTodo } : todo
        ),
      }))
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'タスクの更新に失敗しました'
      set({ error: errorMessage })
    }
  },
}))
