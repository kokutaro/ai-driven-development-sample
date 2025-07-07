/**
 * タスク関連の型定義
 * @fileoverview タスクに関する型定義
 */

/**
 * カテゴリの型定義
 */
export interface Category {
  color: string
  createdAt: Date
  id: string
  name: string
  updatedAt: Date
}

/**
 * タスク作成の入力型
 */
export interface CreateTaskInput {
  categoryId?: string
  description?: string
  dueDate?: Date
  important?: boolean
  reminderDate?: Date
  repeatPattern?: string
  title: string
}

/**
 * サブタスクの型定義
 */
export interface Subtask {
  completed: boolean
  createdAt: Date
  id: string
  order: number
  taskId: string
  title: string
  updatedAt: Date
}

/**
 * タスクの型定義
 */
export interface Task {
  category?: Category
  categoryId?: string
  completed: boolean
  createdAt: Date
  description?: string
  dueDate?: Date
  id: string
  important: boolean
  reminderDate?: Date
  repeatPattern?: string
  subtasks: Subtask[]
  title: string
  updatedAt: Date
  userId: string
}

/**
 * タスクフィルタの型定義
 */
export type TaskFilter =
  | 'all'
  | 'assigned-to-me'
  | 'completed'
  | 'flagged-email'
  | 'important'
  | 'planned'
  | 'today'

/**
 * タスクソート順の型定義
 */
export type TaskSortOrder =
  | 'alphabetical'
  | 'createdAt'
  | 'dueDate'
  | 'importance'

/**
 * タスク更新の入力型
 */
export interface UpdateTaskInput {
  categoryId?: string
  completed?: boolean
  description?: string
  dueDate?: Date
  reminderDate?: Date
  repeatPattern?: string
  title?: string
}
