/**
 * タスク関連のZodスキーマ
 * @fileoverview タスク、カテゴリ、サブタスクのバリデーションスキーマ
 */
import { z } from 'zod'

/**
 * カテゴリスキーマ
 */
export const categorySchema = z.object({
  /**
   * カテゴリ色（Hexカラーコード）
   */
  color: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      '色は有効なHexカラーコード形式で入力してください'
    ),

  /**
   * 作成日時
   */
  createdAt: z.date(),

  /**
   * カテゴリID（UUID）
   */
  id: z.string().uuid('カテゴリIDは有効なUUID形式である必要があります'),

  /**
   * カテゴリ名
   */
  name: z
    .string()
    .min(1, 'カテゴリ名は必須です')
    .max(50, 'カテゴリ名は50文字以内で入力してください'),

  /**
   * 更新日時
   */
  updatedAt: z.date(),
})

/**
 * サブタスクスキーマ
 */
export const subtaskSchema = z.object({
  /**
   * 完了状態
   */
  completed: z.boolean(),

  /**
   * 作成日時
   */
  createdAt: z.date(),

  /**
   * サブタスクID（UUID）
   */
  id: z.string().uuid('サブタスクIDは有効なUUID形式である必要があります'),

  /**
   * 表示順序
   */
  order: z.number().int().min(0, '順序は0以上の整数である必要があります'),

  /**
   * 親タスクID（UUID）
   */
  taskId: z.string().uuid('タスクIDは有効なUUID形式である必要があります'),

  /**
   * サブタスクタイトル
   */
  title: z
    .string()
    .min(1, 'サブタスクタイトルは必須です')
    .max(200, 'サブタスクタイトルは200文字以内で入力してください'),

  /**
   * 更新日時
   */
  updatedAt: z.date(),
})

/**
 * タスクスキーマ
 */
export const taskSchema = z.object({
  /**
   * カテゴリ情報
   */
  category: categorySchema.optional(),

  /**
   * カテゴリID（UUID）
   */
  categoryId: z.string().uuid().optional(),

  /**
   * 完了状態
   */
  completed: z.boolean(),

  /**
   * 作成日時
   */
  createdAt: z.date(),

  /**
   * タスク説明
   */
  description: z
    .string()
    .max(1000, 'タスク説明は1000文字以内で入力してください')
    .optional(),

  /**
   * 期限日
   */
  dueDate: z.date().optional(),

  /**
   * タスクID（UUID）
   */
  id: z.string().uuid('タスクIDは有効なUUID形式である必要があります'),

  /**
   * 重要フラグ
   */
  important: z.boolean(),

  /**
   * リマインダー日時
   */
  reminderDate: z.date().optional(),

  /**
   * 繰り返しパターン
   */
  repeatPattern: z.string().optional(),

  /**
   * サブタスク一覧
   */
  subtasks: z.array(subtaskSchema),

  /**
   * タスクタイトル
   */
  title: z
    .string()
    .min(1, 'タスクタイトルは必須です')
    .max(200, 'タスクタイトルは200文字以内で入力してください'),

  /**
   * 更新日時
   */
  updatedAt: z.date(),

  /**
   * ユーザーID（UUID）
   */
  userId: z.string().uuid('ユーザーIDは有効なUUID形式である必要があります'),
})

/**
 * タスク作成入力スキーマ
 */
export const createTaskInputSchema = z.object({
  /**
   * カテゴリID（UUID）
   */
  categoryId: z.string().uuid().optional(),

  /**
   * タスク説明
   */
  description: z
    .string()
    .max(1000, 'タスク説明は1000文字以内で入力してください')
    .optional(),

  /**
   * 期限日
   */
  dueDate: z.date().optional(),

  /**
   * 重要フラグ
   */
  important: z.boolean().optional(),

  /**
   * リマインダー日時
   */
  reminderDate: z.date().optional(),

  /**
   * 繰り返しパターン
   */
  repeatPattern: z.string().optional(),

  /**
   * タスクタイトル
   */
  title: z
    .string()
    .min(1, 'タスクタイトルは必須です')
    .max(200, 'タスクタイトルは200文字以内で入力してください'),
})

/**
 * タスク更新入力スキーマ
 */
export const updateTaskInputSchema = z.object({
  /**
   * カテゴリID（UUID）
   */
  categoryId: z.string().uuid().nullable().optional(),

  /**
   * 完了状態
   */
  completed: z.boolean().optional(),

  /**
   * タスク説明
   */
  description: z
    .string()
    .max(1000, 'タスク説明は1000文字以内で入力してください')
    .optional(),

  /**
   * 期限日
   */
  dueDate: z.date().nullable().optional(),

  /**
   * 重要フラグ
   */
  important: z.boolean().optional(),

  /**
   * リマインダー日時
   */
  reminderDate: z.date().nullable().optional(),

  /**
   * 繰り返しパターン
   */
  repeatPattern: z.string().nullable().optional(),

  /**
   * タスクタイトル
   */
  title: z
    .string()
    .min(1, 'タスクタイトルは必須です')
    .max(200, 'タスクタイトルは200文字以内で入力してください')
    .optional(),
})

/**
 * タスクフィルタースキーマ
 */
export const taskFilterSchema = z.enum([
  'all',
  'today',
  'important',
  'planned',
  'assigned-to-me',
  'flagged-email',
  'completed',
])

/**
 * タスクソート順スキーマ
 */
export const taskSortOrderSchema = z.enum([
  'createdAt',
  'dueDate',
  'importance',
  'alphabetical',
])

/**
 * 型定義をZodスキーマから生成
 */
export type Category = z.infer<typeof categorySchema>
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>
export type Subtask = z.infer<typeof subtaskSchema>
export type Task = z.infer<typeof taskSchema>
export type TaskFilter = z.infer<typeof taskFilterSchema>
export type TaskSortOrder = z.infer<typeof taskSortOrderSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>
