import { vi } from 'vitest'

import type { User } from '@/types/todo'

/**
 * Auth機能のモック
 *
 * テスト用にauth機能をモック化し、next-authの読み込みを回避します。
 */

// デフォルトのモックユーザー
const mockUser: User = {
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  email: 'test@example.com',
  id: 'test-user-id',
  name: 'Test User',
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
}

/**
 * 現在のユーザーを取得する（モック版）
 */
export const getCurrentUser = vi.fn().mockResolvedValue(mockUser)

/**
 * リクエストから現在のユーザーを取得する（セッション + APIキー認証対応）（モック版）
 */
export const getCurrentUserFromRequest = vi.fn().mockResolvedValue(mockUser)

/**
 * リクエストからユーザーIDを取得する（モック版）
 */
export const getUserIdFromRequest = vi.fn().mockResolvedValue(mockUser.id)

/**
 * リクエストからユーザーIDを取得する（セッション + APIキー認証対応）（モック版）
 */
export const getUserIdFromRequestWithApiKey = vi
  .fn()
  .mockResolvedValue(mockUser.id)

/**
 * 認証状態を確認する（モック版）
 */
export const isAuthenticated = vi.fn().mockResolvedValue(true)

/**
 * 認証が必要なページでユーザーをチェックする（モック版）
 */
export const requireAuth = vi.fn().mockResolvedValue(mockUser)

// デフォルトエクスポート用のオブジェクト
const authMock = {
  getCurrentUser,
  getCurrentUserFromRequest,
  getUserIdFromRequest,
  getUserIdFromRequestWithApiKey,
  isAuthenticated,
  requireAuth,
}

export default authMock

// モジュールモック
vi.mock('@/lib/auth', () => ({
  getCurrentUser,
  getCurrentUserFromRequest,
  getUserIdFromRequest,
  getUserIdFromRequestWithApiKey,
  isAuthenticated,
  requireAuth,
}))
