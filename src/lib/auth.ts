import type { User } from '@/types/todo'

/**
 * 現在のユーザーを取得する
 *
 * 注意: これは簡略化された実装です。
 * 実際のプロダクションでは、JWTトークンの検証やセッション管理が必要です。
 */
export async function getCurrentUser(): Promise<undefined | User> {
  // TODO: 実際の認証実装を追加
  // 現在はモックユーザーを返す
  return {
    createdAt: new Date(),
    email: 'demo@example.com',
    id: 'user-1',
    name: 'Demo User',
    updatedAt: new Date(),
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
