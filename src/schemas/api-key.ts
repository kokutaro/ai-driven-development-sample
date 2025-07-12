import { z } from 'zod'

/**
 * APIキー関連のZodバリデーションスキーマ
 */

/**
 * APIキー作成スキーマ
 */
export const apiKeyCreateSchema = z.object({
  expiresAt: z.string().datetime().optional(),
  name: z
    .string()
    .min(1, 'キー名は必須です')
    .max(100, 'キー名は100文字以内で入力してください')
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      'キー名は英数字、スペース、ハイフン、アンダースコアのみ使用可能です'
    ),
})

/**
 * APIキー削除スキーマ
 */
export const apiKeyDeleteSchema = z.object({
  id: z.string().cuid('無効なAPIキーIDです'),
})

/**
 * APIキーレスポンススキーマ
 */
export const apiKeyResponseSchema = z.object({
  createdAt: z.date(),
  expiresAt: z.date().nullable(),
  id: z.string(),
  lastUsedAt: z.date().nullable(),
  name: z.string(),
  updatedAt: z.date(),
})

/**
 * APIキー作成レスポンススキーマ
 */
export const apiKeyCreateResponseSchema = z.object({
  apiKey: apiKeyResponseSchema,
  plainKey: z.string(),
})

/**
 * 型定義
 */
export type ApiKeyCreateInput = z.infer<typeof apiKeyCreateSchema>
export type ApiKeyCreateResponse = z.infer<typeof apiKeyCreateResponseSchema>
export type ApiKeyDeleteInput = z.infer<typeof apiKeyDeleteSchema>
export type ApiKeyResponse = z.infer<typeof apiKeyResponseSchema>
