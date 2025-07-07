/**
 * ユーザー関連のZodスキーマ
 * @fileoverview ユーザー、認証関連のバリデーションスキーマ
 */
import { z } from 'zod'

/**
 * ユーザースキーマ
 */
export const userSchema = z.object({
  /**
   * 作成日時
   */
  createdAt: z.date(),

  /**
   * メールアドレス
   */
  email: z
    .string()
    .email('有効なメールアドレスを入力してください')
    .min(1, 'メールアドレスは必須です'),

  /**
   * ユーザーID（UUID）
   */
  id: z.string().uuid('ユーザーIDは有効なUUID形式である必要があります'),

  /**
   * ユーザー名
   */
  name: z
    .string()
    .max(100, 'ユーザー名は100文字以内で入力してください')
    .optional(),

  /**
   * 更新日時
   */
  updatedAt: z.date(),
})

/**
 * ログイン入力スキーマ
 */
export const loginInputSchema = z.object({
  /**
   * メールアドレス
   */
  email: z
    .string()
    .email('有効なメールアドレスを入力してください')
    .min(1, 'メールアドレスは必須です'),

  /**
   * パスワード
   */
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .max(72, 'パスワードは72文字以内で入力してください'),
})

/**
 * ユーザー登録入力スキーマ
 */
export const registerInputSchema = z.object({
  /**
   * メールアドレス
   */
  email: z
    .string()
    .email('有効なメールアドレスを入力してください')
    .min(1, 'メールアドレスは必須です'),

  /**
   * ユーザー名
   */
  name: z
    .string()
    .max(100, 'ユーザー名は100文字以内で入力してください')
    .optional(),

  /**
   * パスワード
   */
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .max(72, 'パスワードは72文字以内で入力してください'),
})

/**
 * ユーザー更新入力スキーマ
 */
export const updateUserInputSchema = z.object({
  /**
   * メールアドレス
   */
  email: z
    .string()
    .email('有効なメールアドレスを入力してください')
    .min(1, 'メールアドレスは必須です')
    .optional(),

  /**
   * ユーザー名
   */
  name: z
    .string()
    .max(100, 'ユーザー名は100文字以内で入力してください')
    .optional(),

  /**
   * パスワード
   */
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .max(72, 'パスワードは72文字以内で入力してください')
    .optional(),
})

/**
 * ユーザーセッションスキーマ
 */
export const userSessionSchema = z.object({
  /**
   * セッション有効期限
   */
  expiresAt: z.date(),

  /**
   * JWTトークン
   */
  token: z
    .string()
    .min(10, 'トークンが無効です')
    .max(2048, 'トークンが長すぎます'),

  /**
   * ユーザー情報
   */
  user: userSchema,
})

export type LoginInput = z.infer<typeof loginInputSchema>
export type RegisterInput = z.infer<typeof registerInputSchema>
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>
/**
 * 型定義をZodスキーマから生成
 */
export type User = z.infer<typeof userSchema>
export type UserSession = z.infer<typeof userSessionSchema>
