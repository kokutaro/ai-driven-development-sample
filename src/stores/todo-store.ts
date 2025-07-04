import { create } from 'zustand'

import type { TodoStore, Todo, CreateTodo, UpdateTodo } from '@/types/todo'

/**
 * TodoストアのZustand実装
 *
 * @description Todoアイテムの状態管理を行うストア
 * - todos: Todoアイテムの配列
 * - loading: ローディング状態
 * - error: エラー状態
 * - 各種アクション（CRUD操作）
 */
export const useTodoStore = create<TodoStore>((set, get) => ({
  // State
  todos: [],
  loading: false,
  error: null,

  // Actions
  /**
   * Todoアイテムを全て取得する
   *
   * @description サーバーからTodoアイテムを取得してストアに保存
   */
  fetchTodos: async () => {
    try {
      set({ loading: true, error: null })

      const response = await fetch('/api/todos')
      if (!response.ok) {
        throw new Error('Todoの取得に失敗しました')
      }

      const todos: Todo[] = await response.json()
      set({ todos, loading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Todoの取得に失敗しました',
        loading: false,
      })
    }
  },

  /**
   * 新しいTodoアイテムを追加する
   *
   * @param todo - 新しいTodoアイテムの情報
   * @description サーバーに新しいTodoアイテムを作成し、ストアに追加
   */
  addTodo: async (todo: CreateTodo) => {
    try {
      set({ loading: true, error: null })

      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(todo),
      })

      if (!response.ok) {
        throw new Error('Todoの作成に失敗しました')
      }

      const newTodo: Todo = await response.json()
      set((state) => ({
        todos: [...state.todos, newTodo],
        loading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Todoの作成に失敗しました',
        loading: false,
      })
    }
  },

  /**
   * 既存のTodoアイテムを更新する
   *
   * @param id - 更新対象のTodoアイテムのID
   * @param todo - 更新内容
   * @description サーバーでTodoアイテムを更新し、ストアを更新
   */
  updateTodo: async (id: string, todo: UpdateTodo) => {
    try {
      set({ loading: true, error: null })

      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(todo),
      })

      if (!response.ok) {
        throw new Error('Todoの更新に失敗しました')
      }

      const updatedTodo: Todo = await response.json()
      set((state) => ({
        todos: state.todos.map((t) => (t.id === id ? updatedTodo : t)),
        loading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Todoの更新に失敗しました',
        loading: false,
      })
    }
  },

  /**
   * Todoアイテムを削除する
   *
   * @param id - 削除対象のTodoアイテムのID
   * @description サーバーでTodoアイテムを削除し、ストアから削除
   */
  deleteTodo: async (id: string) => {
    try {
      set({ loading: true, error: null })

      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Todoの削除に失敗しました')
      }

      set((state) => ({
        todos: state.todos.filter((t) => t.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Todoの削除に失敗しました',
        loading: false,
      })
    }
  },

  /**
   * Todoアイテムの完了状態を切り替える
   *
   * @param id - 切り替え対象のTodoアイテムのID
   * @description 指定されたTodoアイテムの完了状態を切り替え
   */
  toggleTodo: async (id: string) => {
    const todo = get().todos.find((t) => t.id === id)
    if (!todo) return

    await get().updateTodo(id, { completed: !todo.completed })
  },

  /**
   * ローディング状態を設定する
   *
   * @param loading - ローディング状態
   * @description ローディング状態を手動で設定
   */
  setLoading: (loading: boolean) => {
    set({ loading })
  },

  /**
   * エラー状態を設定する
   *
   * @param error - エラーメッセージ
   * @description エラー状態を手動で設定
   */
  setError: (error: string | null) => {
    set({ error })
  },
}))
