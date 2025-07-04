import { type z } from 'zod'

import {
  todoSchema,
  createTodoSchema,
  updateTodoSchema,
  deleteTodoSchema,
} from '@/schemas/todo'

/**
 * Todoアイテムの型定義
 *
 * @description Todoアイテムの完全な型定義
 */
export type Todo = z.infer<typeof todoSchema>

/**
 * Todo作成時の型定義
 *
 * @description 新しいTodoアイテムを作成する際の型定義
 */
export type CreateTodo = z.infer<typeof createTodoSchema>

/**
 * Todo更新時の型定義
 *
 * @description 既存のTodoアイテムを更新する際の型定義
 */
export type UpdateTodo = z.infer<typeof updateTodoSchema>

/**
 * Todo削除時の型定義
 *
 * @description Todoアイテムを削除する際の型定義
 */
export type DeleteTodo = z.infer<typeof deleteTodoSchema>

/**
 * TodoストアのState型定義
 *
 * @description Zustandストアで使用するState型
 */
export interface TodoState {
  todos: Todo[]
  loading: boolean
  error: string | null
}

/**
 * TodoストアのActions型定義
 *
 * @description Zustandストアで使用するActions型
 */
export interface TodoActions {
  fetchTodos: () => Promise<void>
  addTodo: (todo: CreateTodo) => Promise<void>
  updateTodo: (id: string, todo: UpdateTodo) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  toggleTodo: (id: string) => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

/**
 * TodoストアのFull型定義
 *
 * @description StateとActionsを結合したストアの完全な型定義
 */
export type TodoStore = TodoState & TodoActions
