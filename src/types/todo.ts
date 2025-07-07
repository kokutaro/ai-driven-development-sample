/**
 * TODO システムの型定義
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
  userId: string
}

/**
 * TODO作成時のデータ型
 */
export interface CreateTodoData {
  categoryId?: string
  description?: string
  dueDate?: Date
  isImportant?: boolean
  title: string
}

/**
 * ページネーション情報の型定義
 */
export interface Pagination {
  hasNext: boolean
  hasPrev: boolean
  limit: number
  page: number
  total: number
  totalPages: number
}

/**
 * リマインダーの型定義
 */
export interface Reminder {
  createdAt: Date
  id: string
  isTriggered: boolean
  reminderAt: Date
  todoId: string
  updatedAt: Date
}

/**
 * サブタスクの型定義
 */
export interface SubTask {
  createdAt: Date
  id: string
  isCompleted: boolean
  order: number
  title: string
  todoId: string
  updatedAt: Date
}

/**
 * TODO項目の型定義
 */
export interface Todo {
  // Relations
  category?: Category | undefined
  categoryId?: string | undefined
  createdAt: Date
  description?: string | undefined
  dueDate?: Date | undefined
  id: string
  isCompleted: boolean
  isImportant: boolean
  order: number
  reminders?: Reminder[]
  subTasks?: SubTask[]

  title: string
  updatedAt: Date
  userId: string
}

/**
 * TODOフィルタの型定義
 */
export type TodoFilter =
  | 'all'
  | 'assigned'
  | 'completed'
  | 'flagged'
  | 'important'
  | 'today'
  | 'upcoming'

/**
 * TODO一覧取得レスポンスの型定義
 */
export interface TodoListResponse {
  pagination: Pagination
  todos: Todo[]
}

/**
 * TODOソート方法の型定義
 */
export type TodoSortBy = 'createdAt' | 'dueDate' | 'importance' | 'title'

/**
 * TODO統計情報の型定義
 */
export interface TodoStats {
  assignedCount: number
  categories: Array<{
    color: string
    completed: number
    id: string
    name: string
    pending: number
    total: number
  }>
  completed: number
  completedCount: number
  completionRate: number
  dailyStats: Array<{
    completed: number
    created: number
    date: string
  }>
  important: number
  importantCount: number
  overdue: number
  pending: number
  todayCount: number
  total: number
  totalCount: number
  upcomingCount: number
}

/**
 * TODO更新時のAPIリクエストデータ型
 */
export interface UpdateTodoApiData {
  categoryId?: string | undefined
  description?: string | undefined
  dueDate?: string | undefined
  isImportant?: boolean
  title?: string
}

/**
 * TODO更新時のデータ型（フロントエンド内部）
 */
export interface UpdateTodoData {
  categoryId?: string | undefined
  description?: string | undefined
  dueDate?: Date | undefined
  isImportant?: boolean
  title?: string
}

/**
 * ユーザーの型定義
 */
export interface User {
  categories?: Category[]
  createdAt: Date
  email: string
  id: string
  name: string

  // Relations
  todos?: Todo[]
  updatedAt: Date
}

export { type ApiResponse } from './api'
