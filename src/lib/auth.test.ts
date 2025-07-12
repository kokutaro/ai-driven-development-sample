import { beforeEach, describe, expect, it, vi } from 'vitest'

// グローバルauthモックを無効化してこのテストファイル専用のモックを使用
vi.unmock('@/lib/auth')

// NextAuth.jsのauthをモック
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

import {
  getCurrentUser,
  getUserIdFromRequest,
  isAuthenticated,
  requireAuth,
} from './auth'

const { auth } = await import('@/auth')
const mockAuth = vi.mocked(
  auth as () => Promise<null | {
    user?: { email: string; id: string; name: string }
  }>
)

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  describe('getCurrentUser', () => {
    it('認証済みユーザーの情報を返す', async () => {
      // Arrange
      const mockSession = {
        user: {
          email: 'test@example.com',
          id: 'user-123',
          name: 'Test User',
        },
      }
      mockAuth.mockResolvedValue(mockSession)

      // Act
      const user = await getCurrentUser()

      // Assert
      expect(user).toEqual({
        createdAt: expect.any(Date),
        email: 'test@example.com',
        id: 'user-123',
        name: 'Test User',
        updatedAt: expect.any(Date),
      })
    })

    it('未認証の場合undefinedを返す', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const user = await getCurrentUser()

      // Assert
      expect(user).toBeUndefined()
    })

    it('セッションにユーザー情報がない場合undefinedを返す', async () => {
      // Arrange
      const mockSession = {}
      mockAuth.mockResolvedValue(mockSession)

      // Act
      const user = await getCurrentUser()

      // Assert
      expect(user).toBeUndefined()
    })
  })

  describe('getUserIdFromRequest', () => {
    it('認証済みユーザーのIDを返す', async () => {
      // Arrange
      const mockSession = {
        user: {
          email: 'test@example.com',
          id: 'user-123',
          name: 'Test User',
        },
      }
      mockAuth.mockResolvedValue(mockSession)

      // Act
      const userId = await getUserIdFromRequest()

      // Assert
      expect(userId).toBe('user-123')
    })

    it('未認証の場合エラーを投げる', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act & Assert
      await expect(getUserIdFromRequest()).rejects.toThrow('認証が必要です')
    })
  })

  describe('isAuthenticated', () => {
    it('認証済みの場合trueを返す', async () => {
      // Arrange
      const mockSession = {
        user: {
          email: 'test@example.com',
          id: 'user-123',
          name: 'Test User',
        },
      }
      mockAuth.mockResolvedValue(mockSession)

      // Act
      const authenticated = await isAuthenticated()

      // Assert
      expect(authenticated).toBe(true)
    })

    it('未認証の場合falseを返す', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const authenticated = await isAuthenticated()

      // Assert
      expect(authenticated).toBe(false)
    })

    it('セッションにユーザー情報がない場合falseを返す', async () => {
      // Arrange
      const mockSession = {}
      mockAuth.mockResolvedValue(mockSession)

      // Act
      const authenticated = await isAuthenticated()

      // Assert
      expect(authenticated).toBe(false)
    })
  })

  describe('requireAuth', () => {
    it('認証済みユーザーの情報を返す', async () => {
      // Arrange
      const mockSession = {
        user: {
          email: 'test@example.com',
          id: 'user-123',
          name: 'Test User',
        },
      }
      mockAuth.mockResolvedValue(mockSession)

      // Act
      const user = await requireAuth()

      // Assert
      expect(user).toEqual({
        createdAt: expect.any(Date),
        email: 'test@example.com',
        id: 'user-123',
        name: 'Test User',
        updatedAt: expect.any(Date),
      })
    })

    it('未認証の場合エラーを投げる', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act & Assert
      await expect(requireAuth()).rejects.toThrow('認証が必要です')
    })
  })
})
