import { z } from 'zod'

/**
 * Todoアイテムのベーススキーマ
 *
 * @description Todoアイテムの基本的なフィールドを定義するスキーマ
 */
export const todoSchema = z.object({
  id: z.string().cuid(),
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(255, 'タイトルは255文字以内で入力してください'),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
})

/**
 * Todo作成用のスキーマ
 *
 * @description 新しいTodoアイテムを作成する際に使用するスキーマ
 * IDと日時フィールドを除外したスキーマ
 */
export const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(255, 'タイトルは255文字以内で入力してください'),
  description: z.string().optional(),
  completed: z.boolean().default(false),
})

/**
 * Todo更新用のスキーマ
 *
 * @description 既存のTodoアイテムを更新する際に使用するスキーマ
 * 全てのフィールドをオプションにして部分更新を可能にする
 */
export const updateTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(255, 'タイトルは255文字以内で入力してください')
    .optional(),
  description: z.string().optional(),
  completed: z.boolean().optional(),
})

/**
 * Todo削除用のスキーマ
 *
 * @description Todoアイテムを削除する際に使用するスキーマ
 */
export const deleteTodoSchema = z.object({
  id: z.string().cuid(),
})
