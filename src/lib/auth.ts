import type { User } from '@/types/todo'

import { auth } from '@/auth'

/**
 * 現在のユーザーを取得する
 *
 * NextAuth.jsのセッションから認証済みユーザー情報を取得します。
 */
export async function getCurrentUser(): Promise<undefined | User> {
  const session = await auth()

  if (!session?.user) {
    return undefined
  }

  // NextAuth.jsのSessionUserをアプリケーションのUserタイプに変換
  return {
    createdAt: new Date(), // 実際のデータベースから取得する場合は適切な値を設定
    email: session.user.email ?? '',
    id: session.user.id ?? '',
    name: session.user.name ?? '',
    updatedAt: new Date(), // 実際のデータベースから取得する場合は適切な値を設定
  }
}

/**
 * リクエストからユーザーIDを取得する
 */
export async function getUserIdFromRequest(): Promise<string> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('認証が必要です')
  }
  return user.id
}

/**
 * 認証状態を確認する
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await auth()
  return !!session?.user
}

/**
 * 認証が必要なページでユーザーをチェックする
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('認証が必要です')
  }
  return user
}
