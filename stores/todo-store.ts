import { create } from 'zustand'

import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/types/todo'

import { generateUUID } from '@/lib/utils'

/**
 * TODO項目の状態管理を行うストアの型定義
 */
interface TodoStore {
  /** TODO項目を追加する */
  addTodo: (input: CreateTodoInput) => void

  /** TODO項目を削除する */
  deleteTodo: (id: string) => void

  /** すべてのTODO項目を取得する */
  getAllTodos: () => Todo[]

  /** 完了したTODO項目を取得する */
  getCompletedTodos: () => Todo[]

  /** 未完了のTODO項目を取得する */
  getPendingTodos: () => Todo[]

  /** TODO項目をIDで取得する */
  getTodoById: (id: string) => Todo | undefined

  /** 初期データを設定する */
  initializeTodos: (todos: Todo[]) => void

  /** ローディング状態 */
  isLoading: boolean

  /** TODO項目のリスト */
  todos: Todo[]

  /** TODO項目の状態を切り替える */
  toggleTodoStatus: (id: string) => void

  /** TODO項目を更新する */
  updateTodo: (id: string, input: UpdateTodoInput) => void
}

/**
 * TODO項目を管理するZustandストア
 */
export const useTodoStore = create<TodoStore>((set, get) => ({
  addTodo: (input: CreateTodoInput) => {
    const now = new Date()
    const newTodo: Todo = {
      createdAt: now,
      description: input.description,
      id: generateUUID(),
      status: 'pending',
      title: input.title,
      updatedAt: now,
    }

    set((state) => ({
      todos: [...state.todos, newTodo],
    }))
  },
  deleteTodo: (id: string) => {
    set((state) => ({
      todos: state.todos.filter((todo) => todo.id !== id),
    }))
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

  initializeTodos: (todos: Todo[]) => {
    set({ todos })
  },

  isLoading: false,

  todos: [],

  toggleTodoStatus: (id: string) => {
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              status: todo.status === 'completed' ? 'pending' : 'completed',
              updatedAt: new Date(),
            }
          : todo
      ),
    }))
  },

  updateTodo: (id: string, input: UpdateTodoInput) => {
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              ...input,
              updatedAt: new Date(),
            }
          : todo
      ),
    }))
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
