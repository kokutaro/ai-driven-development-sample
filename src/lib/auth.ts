import type { User } from '@/types/todo'
import type { NextRequest } from 'next/server'

import { auth } from '@/auth'
import { getUserIdFromApiKey } from '@/lib/api-key'
import { prisma } from '@/lib/db'

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
    image: session.user.image ?? undefined,
    name: session.user.name ?? '',
    updatedAt: new Date(), // 実際のデータベースから取得する場合は適切な値を設定
  }
}

/**
 * セッション認証またはAPIキー認証でユーザーを取得する
 *
 * @param request - Next.jsリクエストオブジェクト（オプション）
 * @returns ユーザー情報
 */
export async function getCurrentUserFromRequest(
  request?: NextRequest
): Promise<undefined | User> {
  // まずセッション認証を試す
  const sessionUser = await getCurrentUser()
  if (sessionUser) {
    return sessionUser
  }

  // セッション認証が失敗した場合、APIキー認証を試す
  if (request) {
    const apiKeyUser = await getUserFromApiKey(request)
    if (apiKeyUser) {
      return apiKeyUser
    }
  }

  return undefined
}

/**
 * リクエストからAPIキーを取得してユーザーを認証する
 *
 * @param request - Next.jsリクエストオブジェクト
 * @returns ユーザー情報（認証失敗時はundefined）
 */
export async function getUserFromApiKey(
  request: NextRequest
): Promise<undefined | User> {
  const apiKey = request.nextUrl.searchParams.get('apiKey')
  if (!apiKey) {
    return undefined
  }

  const userId = await getUserIdFromApiKey(apiKey)
  if (!userId) {
    return undefined
  }

  // データベースからユーザー情報を取得
  const user = await prisma.user.findUnique({
    select: {
      createdAt: true,
      email: true,
      id: true,
      image: true,
      name: true,
      updatedAt: true,
    },
    where: { id: userId },
  })

  if (!user) {
    return undefined
  }

  return {
    createdAt: user.createdAt,
    email: user.email ?? '',
    id: user.id,
    image: user.image ?? undefined,
    name: user.name ?? '',
    updatedAt: user.updatedAt,
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
 * セッション認証またはAPIキー認証でユーザーIDを取得する
 *
 * @param request - Next.jsリクエストオブジェクト（オプション）
 * @returns ユーザーID
 */
export async function getUserIdFromRequestWithApiKey(
  request?: NextRequest
): Promise<string> {
  const user = await getCurrentUserFromRequest(request)
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
