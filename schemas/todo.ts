import { z } from 'zod'

/**
 * TODO項目のステータス
 */
export const todoStatusSchema = z.enum(['pending', 'completed'])

/**
 * TODO項目のスキーマ
 */
export const todoSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().optional(),
  status: todoStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

/**
 * TODO項目の作成リクエストスキーマ
 */
export const createTodoSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().optional(),
})

/**
 * TODO項目の更新リクエストスキーマ
 */
export const updateTodoSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').optional(),
  description: z.string().optional(),
  status: todoStatusSchema.optional(),
})

/**
 * TODO項目の型定義
 */
export type Todo = z.infer<typeof todoSchema>

/**
 * TODO項目のステータス型定義
 */
export type TodoStatus = z.infer<typeof todoStatusSchema>

/**
 * TODO項目作成リクエストの型定義
 */
export type CreateTodoRequest = z.infer<typeof createTodoSchema>

/**
 * TODO項目更新リクエストの型定義
 */
export type UpdateTodoRequest = z.infer<typeof updateTodoSchema>
