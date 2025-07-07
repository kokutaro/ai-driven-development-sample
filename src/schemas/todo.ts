import { z } from 'zod'

/**
 * TODOバリデーションスキーマ
 */
export const todoSchema = z.object({
  categoryId: z.string().uuid().optional(),
  description: z
    .string()
    .max(1000, '説明は1000文字以内で入力してください')
    .optional(),
  dueDate: z.string().datetime().optional(),
  isImportant: z.boolean().default(false),
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以内で入力してください'),
})

export const todoUpdateSchema = todoSchema.partial()

export const todoQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  filter: z
    .enum(['today', 'important', 'upcoming', 'completed', 'all'])
    .default('all'),
  limit: z.coerce.number().min(1).max(100).default(50),
  page: z.coerce.number().min(1).default(1),
  sortBy: z.enum(['createdAt', 'dueDate', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type TodoFormData = z.infer<typeof todoSchema>
export type TodoQueryParams = z.infer<typeof todoQuerySchema>
export type TodoUpdateData = z.infer<typeof todoUpdateSchema>
