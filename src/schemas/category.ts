import { z } from 'zod'

/**
 * カテゴリ作成・更新のバリデーションスキーマ
 */
export const categorySchema = z.object({
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '色は#xxxxxxの形式で入力してください'),
  name: z
    .string()
    .min(1, 'カテゴリ名は必須です')
    .max(50, 'カテゴリ名は50文字以内で入力してください'),
})

export type CategoryFormData = z.infer<typeof categorySchema>
