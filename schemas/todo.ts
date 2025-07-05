import { z } from 'zod'

/**
 * TODO項目の状態を表すZodスキーマ
 */
export const todoStatusSchema = z.enum(['completed', 'pending'])

/**
 * TODO項目作成時の入力データのZodスキーマ
 */
export const createTodoInputSchema = z.object({
  description: z.string().optional(),
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(100, 'タイトルは100文字以内で入力してください'),
})

/**
 * TODO項目の構造を表すZodスキーマ
 */
export const todoSchema = z.object({
  createdAt: z.date(),
  description: z.string().optional(),
  id: z.string(),
  status: todoStatusSchema,
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(100, 'タイトルは100文字以内で入力してください'),
  updatedAt: z.date(),
})

/**
 * TODO項目更新時の入力データのZodスキーマ
 */
export const updateTodoInputSchema = z.object({
  description: z.string().optional(),
  status: todoStatusSchema.optional(),
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(100, 'タイトルは100文字以内で入力してください')
    .optional(),
})

/**
 * 型安全性のためのZodスキーマの型推論
 */
export type ZodCreateTodoInput = z.infer<typeof createTodoInputSchema>
export type ZodTodo = z.infer<typeof todoSchema>
export type ZodTodoStatus = z.infer<typeof todoStatusSchema>
export type ZodUpdateTodoInput = z.infer<typeof updateTodoInputSchema>
