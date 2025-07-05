import { create } from 'zustand'

import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/types/todo'

import * as todoService from '@/lib/todo-service'

/**
 * TODO項目の状態管理を行うストアの型定義
 */
interface TodoStore {
  /** TODO項目を追加する */
  addTodo: (input: CreateTodoInput) => Promise<void>

  /** TODO項目を削除する */
  deleteTodo: (id: string) => Promise<void>

  /** すべてのTODO項目を取得する */
  getAllTodos: () => Todo[]

  /** 完了したTODO項目を取得する */
  getCompletedTodos: () => Todo[]

  /** 未完了のTODO項目を取得する */
  getPendingTodos: () => Todo[]

  /** TODO項目をIDで取得する */
  getTodoById: (id: string) => Todo | undefined

  /** 初期データを設定する */
  initializeTodos: (todos?: Todo[]) => Promise<void>

  /** ローディング状態 */
  isLoading: boolean

  /** TODO項目のリスト */
  todos: Todo[]

  /** TODO項目の状態を切り替える */
  toggleTodoStatus: (id: string) => Promise<void>

  /** TODO項目を更新する */
  updateTodo: (id: string, input: UpdateTodoInput) => Promise<void>
}

/**
 * TODO項目を管理するZustandストア
 */
export const useTodoStore = create<TodoStore>((set, get) => ({
  addTodo: async (input: CreateTodoInput) => {
    set({ isLoading: true })
    try {
      const newTodo = await todoService.createTodo(input)
      set((state) => ({
        isLoading: false,
        todos: [...state.todos, newTodo],
      }))
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
  deleteTodo: async (id: string) => {
    set({ isLoading: true })
    try {
      await todoService.deleteTodo(id)
      set((state) => ({
        isLoading: false,
        todos: state.todos.filter((todo) => todo.id !== id),
      }))
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  getAllTodos: () => {
    return get().todos
  },

  getCompletedTodos: () => {
    return get().todos.filter((todo) => todo.status === 'completed')
  },

  getPendingTodos: () => {
    return get().todos.filter((todo) => todo.status === 'pending')
  },

  getTodoById: (id: string) => {
    return get().todos.find((todo) => todo.id === id)
  },

  initializeTodos: async (todos?: Todo[]) => {
    if (todos) {
      set({ todos })
    } else {
      set({ isLoading: true })
      try {
        const fetchedTodos = await todoService.getTodos()
        set({ isLoading: false, todos: fetchedTodos })
      } catch (error) {
        set({ isLoading: false })
        throw error
      }
    }
  },

  isLoading: false,

  todos: [],

  toggleTodoStatus: async (id: string) => {
    set({ isLoading: true })
    try {
      const updatedTodo = await todoService.toggleTodo(id)
      set((state) => ({
        isLoading: false,
        todos: state.todos.map((todo) => (todo.id === id ? updatedTodo : todo)),
      }))
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  updateTodo: async (id: string, input: UpdateTodoInput) => {
    set({ isLoading: true })
    try {
      const updatedTodo = await todoService.updateTodo(id, input)
      set((state) => ({
        isLoading: false,
        todos: state.todos.map((todo) => (todo.id === id ? updatedTodo : todo)),
      }))
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
}))

/**
 * TODO項目の統計情報を取得するセレクタ
 */
export function useTodoStats() {
  const todos = useTodoStore((state) => state.todos)

  return {
    completed: todos.filter((todo) => todo.status === 'completed').length,
    completionRate:
      todos.length > 0
        ? Math.round(
            (todos.filter((todo) => todo.status === 'completed').length /
              todos.length) *
              100
          )
        : 0,
    pending: todos.filter((todo) => todo.status === 'pending').length,
    total: todos.length,
  }
}
