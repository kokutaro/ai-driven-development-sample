/**
 * TODO項目作成時の入力データタイプ
 */
export interface CreateTodoInput {
  /** TODO項目の説明（オプション） */
  description?: string
  /** TODO項目の期限（オプション） */
  dueDate?: Date | null | string
  /** TODO項目の状態（オプション、デフォルト: pending） */
  status?: TodoStatus
  /** TODO項目のタイトル */
  title: string
}

/**
 * TODO項目の構造を表すタイプ
 */
export interface Todo {
  /** TODO項目の作成日時 */
  createdAt: Date | string
  /** TODO項目の説明（オプション） */
  description?: string
  /** TODO項目の期限（オプション） */
  dueDate?: Date | null | string
  /** TODO項目の一意識別子 */
  id: string
  /** TODO項目の状態 */
  status: TodoStatus
  /** TODO項目のタイトル */
  title: string
  /** TODO項目の更新日時 */
  updatedAt: Date | string
}

/**
 * TODO項目の状態を表すタイプ
 */
export type TodoStatus = 'completed' | 'pending'

/**
 * TODO項目更新時の入力データタイプ
 */
export interface UpdateTodoInput {
  /** TODO項目の説明（オプション） */
  description?: string
  /** TODO項目の期限（オプション） */
  dueDate?: Date | null | string
  /** TODO項目の状態 */
  status?: TodoStatus
  /** TODO項目のタイトル */
  title?: string
}
