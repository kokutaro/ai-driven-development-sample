import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getCurrentUser,
  getCurrentUserFromRequest,
  getUserFromApiKey,
  getUserIdFromRequest,
  getUserIdFromRequestWithApiKey,
  isAuthenticated,
  requireAuth,
} from './auth'

import type { User } from '@/types/todo'
import type { NextRequest } from 'next/server'

// グローバルauthモックを無効化してこのテストファイル専用のモックを使用
vi.unmock('@/lib/auth')

// NextAuth.jsのauthをモック
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

// 追加の依存関係をモック
vi.mock('@/lib/api-key', () => ({
  getUserIdFromApiKey: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

const { auth } = await import('@/auth')
const { getUserIdFromApiKey } = await import('@/lib/api-key')
const { prisma } = await import('@/lib/db')

const mockAuth = vi.mocked(
  auth as () => Promise<null | {
    user?: { email: string; id: string; name: string }
  }>
)
const mockGetUserIdFromApiKey = vi.mocked(getUserIdFromApiKey)
const mockPrismaUserFindUnique = vi.mocked(prisma.user.findUnique)

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

  describe('getCurrentUserFromRequest', () => {
    const mockUser: User = {
      createdAt: new Date('2024-01-01'),
      email: 'test@example.com',
      id: 'user123',
      image: 'https://example.com/avatar.jpg',
      name: 'Test User',
      updatedAt: new Date('2024-01-01'),
    }

    const mockPrismaUser = {
      createdAt: new Date('2024-01-01'),
      email: 'test@example.com',
      emailVerified: null,
      id: 'user123',
      image: 'https://example.com/avatar.jpg',
      name: 'Test User',
      updatedAt: new Date('2024-01-01'),
    }

    it('セッション認証が成功した場合はセッションユーザーを返す', async () => {
      // Arrange
      const mockSession = {
        user: {
          email: 'test@example.com',
          id: 'user123',
          name: 'Test User',
        },
      }
      mockAuth.mockResolvedValue(mockSession)

      // Act
      const result = await getCurrentUserFromRequest()

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          email: 'test@example.com',
          id: 'user123',
          name: 'Test User',
        })
      )
    })

    it('セッション認証が失敗してもAPIキー認証が成功した場合はAPIキーユーザーを返す', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)
      mockGetUserIdFromApiKey.mockResolvedValueOnce('user123')
      mockPrismaUserFindUnique.mockResolvedValueOnce(mockPrismaUser)

      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: vi.fn().mockReturnValue('todo_test-api-key'),
          },
        },
      } as unknown as NextRequest

      // Act
      const result = await getCurrentUserFromRequest(mockRequest)

      // Assert
      expect(result).toEqual(mockUser)
    })

    it('両方の認証が失敗した場合はundefinedを返す', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const result = await getCurrentUserFromRequest()

      // Assert
      expect(result).toBeUndefined()
    })
  })

  describe('getUserFromApiKey', () => {
    const mockUser: User = {
      createdAt: new Date('2024-01-01'),
      email: 'test@example.com',
      id: 'user123',
      image: 'https://example.com/avatar.jpg',
      name: 'Test User',
      updatedAt: new Date('2024-01-01'),
    }

    const mockPrismaUser = {
      createdAt: new Date('2024-01-01'),
      email: 'test@example.com',
      emailVerified: null,
      id: 'user123',
      image: 'https://example.com/avatar.jpg',
      name: 'Test User',
      updatedAt: new Date('2024-01-01'),
    }

    it('有効なAPIキーの場合はユーザーを返す', async () => {
      // Arrange
      mockGetUserIdFromApiKey.mockResolvedValueOnce('user123')
      mockPrismaUserFindUnique.mockResolvedValueOnce(mockPrismaUser)

      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: vi.fn().mockReturnValue('todo_test-api-key'),
          },
        },
      } as unknown as NextRequest

      // Act
      const result = await getUserFromApiKey(mockRequest)

      // Assert
      expect(result).toEqual(mockUser)
    })

    it('APIキーが提供されていない場合はundefinedを返す', async () => {
      // Arrange
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: vi.fn().mockReturnValue(null),
          },
        },
      } as unknown as NextRequest

      // Act
      const result = await getUserFromApiKey(mockRequest)

      // Assert
      expect(result).toBeUndefined()
    })

    it('無効なAPIキーの場合はundefinedを返す', async () => {
      // Arrange
      mockGetUserIdFromApiKey.mockResolvedValueOnce(undefined)

      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: vi.fn().mockReturnValue('invalid-api-key'),
          },
        },
      } as unknown as NextRequest

      // Act
      const result = await getUserFromApiKey(mockRequest)

      // Assert
      expect(result).toBeUndefined()
    })

    it('ユーザーがデータベースに見つからない場合はundefinedを返す', async () => {
      // Arrange
      mockGetUserIdFromApiKey.mockResolvedValueOnce('user123')
      mockPrismaUserFindUnique.mockResolvedValueOnce(null)

      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: vi.fn().mockReturnValue('todo_test-api-key'),
          },
        },
      } as unknown as NextRequest

      // Act
      const result = await getUserFromApiKey(mockRequest)

      // Assert
      expect(result).toBeUndefined()
    })

    it('emailとimageがnullの場合は空文字とundefinedに変換される', async () => {
      // Arrange
      const userWithNulls = {
        ...mockPrismaUser,
        email: null,
        image: null,
      }

      mockGetUserIdFromApiKey.mockResolvedValueOnce('user123')
      mockPrismaUserFindUnique.mockResolvedValueOnce(userWithNulls)

      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: vi.fn().mockReturnValue('todo_test-api-key'),
          },
        },
      } as unknown as NextRequest

      // Act
      const result = await getUserFromApiKey(mockRequest)

      // Assert
      expect(result).toEqual({
        ...mockUser,
        email: '',
        image: undefined,
      })
    })

    it('nameがnullの場合は空文字に変換される', async () => {
      // Arrange
      const userWithNullName = {
        ...mockPrismaUser,
        name: null,
      }

      mockGetUserIdFromApiKey.mockResolvedValueOnce('user123')
      mockPrismaUserFindUnique.mockResolvedValueOnce(userWithNullName)

      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: vi.fn().mockReturnValue('todo_test-api-key'),
          },
        },
      } as unknown as NextRequest

      // Act
      const result = await getUserFromApiKey(mockRequest)

      // Assert
      expect(result).toEqual({
        ...mockUser,
        name: '',
      })
    })
  })

  describe('getUserIdFromRequestWithApiKey', () => {
    const mockPrismaUser = {
      createdAt: new Date('2024-01-01'),
      email: 'test@example.com',
      emailVerified: null,
      id: 'user123',
      image: 'https://example.com/avatar.jpg',
      name: 'Test User',
      updatedAt: new Date('2024-01-01'),
    }

    it('セッション認証が成功した場合はユーザーIDを返す', async () => {
      // Arrange
      const mockSession = {
        user: {
          email: 'test@example.com',
          id: 'user123',
          name: 'Test User',
        },
      }
      mockAuth.mockResolvedValue(mockSession)

      // Act
      const result = await getUserIdFromRequestWithApiKey()

      // Assert
      expect(result).toBe('user123')
    })

    it('APIキー認証が成功した場合はユーザーIDを返す', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)
      mockGetUserIdFromApiKey.mockResolvedValueOnce('user123')
      mockPrismaUserFindUnique.mockResolvedValueOnce(mockPrismaUser)

      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: vi.fn().mockReturnValue('todo_test-api-key'),
          },
        },
      } as unknown as NextRequest

      // Act
      const result = await getUserIdFromRequestWithApiKey(mockRequest)

      // Assert
      expect(result).toBe('user123')
    })

    it('両方の認証が失敗した場合はエラーを投げる', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act & Assert
      await expect(getUserIdFromRequestWithApiKey()).rejects.toThrow(
        '認証が必要です'
      )
    })
  })

  describe('getCurrentUser - additional edge cases', () => {
    it('セッションユーザーのプロパティがnullの場合は適切に変換される', async () => {
      // Arrange
      const incompleteSession = {
        user: undefined,
      }
      mockAuth.mockResolvedValue(
        incompleteSession as unknown as {
          user?: { email: string; id: string; name: string }
        }
      )

      // Act
      const result = await getCurrentUser()

      // Assert
      expect(result).toBeUndefined()
    })
  })
})
