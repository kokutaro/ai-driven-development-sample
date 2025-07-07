/**
 * ユーザー関連の型定義
 * @fileoverview ユーザーに関する型定義
 */

/**
 * ログイン入力の型定義
 */
export interface LoginInput {
  email: string
  password: string
}

/**
 * ユーザー登録入力の型定義
 */
export interface RegisterInput {
  email: string
  name?: string
  password: string
}

/**
 * ユーザー更新入力の型定義
 */
export interface UpdateUserInput {
  email?: string
  name?: string
  password?: string
}

/**
 * ユーザーの型定義
 */
export interface User {
  createdAt: Date
  email: string
  id: string
  name?: string
  updatedAt: Date
}

/**
 * ユーザーセッションの型定義
 */
export interface UserSession {
  expiresAt: Date
  token: string
  user: User
}
