/**
 * API関連のZodスキーマ
 * @fileoverview APIレスポンス、リクエストオプション関連のバリデーションスキーマ
 */
import { z } from 'zod'

/**
 * HTTPメソッドスキーマ
 */
export const httpMethodSchema = z.enum([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
])

/**
 * APIリクエストオプションスキーマ
 */
export const apiRequestOptionsSchema = z.object({
  /**
   * リクエストボディ
   */
  body: z.unknown().optional(),

  /**
   * リクエストヘッダー
   */
  headers: z.record(z.string()).optional(),

  /**
   * HTTPメソッド
   */
  method: httpMethodSchema.optional(),

  /**
   * クエリパラメータ
   */
  params: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
})

/**
 * API成功レスポンススキーマ
 */
export const apiSuccessResponseSchema = z.object({
  /**
   * レスポンスデータ
   */
  data: z.unknown(),

  /**
   * 成功メッセージ
   */
  message: z.string().optional(),

  /**
   * 成功フラグ（trueのみ許可）
   */
  success: z.literal(true),
})

/**
 * APIエラーレスポンススキーマ
 */
export const apiErrorResponseSchema = z.object({
  /**
   * エラー情報
   */
  error: z.object({
    /**
     * エラーコード
     */
    code: z.string().min(1, 'エラーコードは必須です'),

    /**
     * エラー詳細情報
     */
    details: z.unknown().optional(),

    /**
     * エラーメッセージ
     */
    message: z.string().min(1, 'エラーメッセージは必須です'),
  }),

  /**
   * 成功フラグ（falseのみ許可）
   */
  success: z.literal(false),
})

/**
 * ページネーション情報スキーマ
 */
export const paginationInfoSchema = z.object({
  /**
   * 次のページが存在するか
   */
  hasNext: z.boolean(),

  /**
   * 前のページが存在するか
   */
  hasPrevious: z.boolean(),

  /**
   * 現在のページ番号（1以上）
   */
  page: z.number().int().min(1, 'ページ番号は1以上である必要があります'),

  /**
   * 1ページあたりのアイテム数（1以上1000以下）
   */
  pageSize: z
    .number()
    .int()
    .min(1, 'ページサイズは1以上である必要があります')
    .max(1000, 'ページサイズは1000以下である必要があります'),

  /**
   * 総アイテム数（0以上）
   */
  totalCount: z
    .number()
    .int()
    .min(0, '総アイテム数は0以上である必要があります'),

  /**
   * 総ページ数（0以上）
   */
  totalPages: z.number().int().min(0, '総ページ数は0以上である必要があります'),
})

/**
 * ページネーション付きレスポンススキーマ
 */
export const paginatedResponseSchema = z.object({
  /**
   * アイテム配列
   */
  items: z.array(z.unknown()),

  /**
   * ページネーション情報
   */
  pagination: paginationInfoSchema,
})

/**
 * APIレスポンス統合スキーマ
 */
export const apiResponseSchema = z.union([
  apiSuccessResponseSchema,
  apiErrorResponseSchema,
])

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>
export type ApiRequestOptions = z.infer<typeof apiRequestOptionsSchema>
export type ApiResponse<T = unknown> = ApiErrorResponse | ApiSuccessResponse<T>
export type ApiSuccessResponse<T = unknown> = Omit<
  z.infer<typeof apiSuccessResponseSchema>,
  'data'
> & {
  data: T
}
/**
 * 型定義をZodスキーマから生成
 */
export type HttpMethod = z.infer<typeof httpMethodSchema>
export type PaginatedResponse<T = unknown> = Omit<
  z.infer<typeof paginatedResponseSchema>,
  'items'
> & {
  items: T[]
}
export type PaginationInfo = z.infer<typeof paginationInfoSchema>
