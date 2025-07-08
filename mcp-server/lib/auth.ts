import type { User } from '@prisma/client'
import { mcpPrisma } from './db'

/**
 * MCP サーバー用認証機能
 *
 * 注意: これは簡略化された実装です。
 * 実際のプロダクションでは、より堅牢な認証機構が必要です。
 */

/**
 * デフォルトユーザーID（開発用）
 * 実際の実装では、認証トークンやAPIキーからユーザーを特定します。
 */
const DEFAULT_USER_ID = 'user-1'

/**
 * 現在のユーザーを取得する
 *
 * @returns ユーザー情報またはnull
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    // 開発用の固定ユーザーを取得
    // 実際の実装では、リクエストヘッダーからトークンを取得し、
    // JWTの検証やセッション管理を行う
    const user = await mcpPrisma.user.findUnique({
      where: {
        id: DEFAULT_USER_ID,
      },
    })

    if (!user) {
      // デフォルトユーザーが存在しない場合は作成
      const newUser = await mcpPrisma.user.create({
        data: {
          id: DEFAULT_USER_ID,
          email: 'demo@example.com',
          name: 'Demo User',
        },
      })
      return newUser
    }

    return user
  } catch (error) {
    console.error('MCP Server: Failed to get current user:', error)
    return null
  }
}

/**
 * ユーザーIDを取得する
 *
 * @returns ユーザーID
 * @throws 認証エラーの場合
 */
export async function getUserId(): Promise<string> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('認証が必要です')
  }
  return user.id
}

/**
 * ユーザーがリソースにアクセス権限を持つかチェック
 *
 * @param resourceUserId リソースの所有者ID
 * @returns アクセス権限の有無
 */
export async function hasAccessToResource(resourceUserId: string): Promise<boolean> {
  try {
    const currentUserId = await getUserId()
    return currentUserId === resourceUserId
  } catch {
    return false
  }
}