import { create } from 'zustand'

import type { Todo } from '@/types/todo'

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
  updateTodo: (id: string, data: Partial<Todo>) => Promise<void>
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
      const response = await todoClient.createTodo(data)
      const newTodo = response.data
      set((state) => ({
        isLoading: false,
        todos: [newTodo, ...state.todos],
      }))
    } catch {
      set({ error: 'タスクの作成に失敗しました', isLoading: false })
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
    } catch {
      set({ error: 'タスクの削除に失敗しました', isLoading: false })
    }
  },

  error: undefined,

  fetchTodos: async (filter = 'all') => {
    set({ error: undefined, isLoading: true })
    try {
      const response = await todoClient.getTodos({ filter })
      const todos = response.data.todos
      set({ isLoading: false, todos })
    } catch {
      set({ error: 'タスクの取得に失敗しました', isLoading: false })
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
    } catch {
      set({ error: 'タスクの状態更新に失敗しました' })
    }
  },

  updateTodo: async (id, data) => {
    try {
      const response = await todoClient.updateTodo(id, data)
      const updatedTodo = response.data
      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === id ? { ...todo, ...updatedTodo } : todo
        ),
      }))
    } catch {
      set({ error: 'タスクの更新に失敗しました' })
    }
  },
}))
