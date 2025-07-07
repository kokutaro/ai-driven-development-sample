/**
 * 認証ストアのテスト
 * @fileoverview Zustand認証ストアのユニットテスト
 */
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from './auth-store'

import type { User, UserSession } from '@/types/user'

// テスト用のモックユーザーデータ
const mockUser: User = {
  createdAt: new Date('2023-01-01'),
  email: 'test@example.com',
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test User',
  updatedAt: new Date('2023-01-01'),
}

const mockSession: UserSession = {
  expiresAt: new Date('2024-01-01'),
  token: 'mock-jwt-token-1234567890',
  user: mockUser,
}

describe('useAuthStore', () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.resetStore()
    })
  })

  describe('初期状態', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.user).toBeUndefined()
      expect(result.current.session).toBeUndefined()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeUndefined()
    })

    it('should have correct computed properties in initial state', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.getIsAuthenticated()).toBe(false)
      expect(result.current.getUserId()).toBeUndefined()
      expect(result.current.getUserEmail()).toBeUndefined()
      expect(result.current.getUserName()).toBeUndefined()
    })
  })

  describe('認証状態管理', () => {
    it('should set user correctly', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setUser(mockUser)
      })

      expect(result.current.user).toEqual(mockUser)
    })

    it('should set session correctly', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setSession(mockSession)
      })

      expect(result.current.session).toEqual(mockSession)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should clear user correctly', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setUser(mockUser)
        result.current.clearUser()
      })

      expect(result.current.user).toBeUndefined()
    })

    it('should clear session correctly', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setSession(mockSession)
        result.current.clearSession()
      })

      expect(result.current.session).toBeUndefined()
      expect(result.current.user).toBeUndefined()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should update user correctly', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setUser(mockUser)
        result.current.updateUser({ name: 'Updated Name' })
      })

      expect(result.current.user?.name).toBe('Updated Name')
      expect(result.current.user?.email).toBe(mockUser.email)
      expect(result.current.user?.id).toBe(mockUser.id)
    })

    it('should not update user when no user is set', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.updateUser({ name: 'Updated Name' })
      })

      expect(result.current.user).toBeUndefined()
    })
  })

  describe('認証状態計算プロパティ', () => {
    it('should return correct authentication status', () => {
      const { result } = renderHook(() => useAuthStore())

      // 初期状態：未認証
      expect(result.current.getIsAuthenticated()).toBe(false)

      // ユーザーのみ設定：未認証
      act(() => {
        result.current.setUser(mockUser)
      })
      expect(result.current.getIsAuthenticated()).toBe(false)

      // セッション設定：認証済み
      act(() => {
        result.current.setSession(mockSession)
      })
      expect(result.current.getIsAuthenticated()).toBe(true)
    })

    it('should return correct user ID', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.getUserId()).toBeUndefined()

      act(() => {
        result.current.setUser(mockUser)
      })

      expect(result.current.getUserId()).toBe(mockUser.id)
    })

    it('should return correct user email', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.getUserEmail()).toBeUndefined()

      act(() => {
        result.current.setUser(mockUser)
      })

      expect(result.current.getUserEmail()).toBe(mockUser.email)
    })

    it('should return correct user name', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.getUserName()).toBeUndefined()

      act(() => {
        result.current.setUser(mockUser)
      })

      expect(result.current.getUserName()).toBe(mockUser.name)
    })

    it('should handle user without name', () => {
      const { result } = renderHook(() => useAuthStore())
      const userWithoutName = { ...mockUser, name: undefined }

      act(() => {
        result.current.setUser(userWithoutName)
      })

      expect(result.current.getUserName()).toBeUndefined()
    })
  })

  describe('セッション管理', () => {
    it('should check if session is expired', () => {
      const { result } = renderHook(() => useAuthStore())

      // 期限切れのセッション
      const expiredSession: UserSession = {
        ...mockSession,
        expiresAt: new Date('2020-01-01'), // 過去の日付
      }

      act(() => {
        result.current.setSession(expiredSession)
      })

      expect(result.current.isSessionExpired()).toBe(true)
    })

    it('should check if session is not expired', () => {
      const { result } = renderHook(() => useAuthStore())

      // 有効なセッション
      const validSession: UserSession = {
        ...mockSession,
        expiresAt: new Date('2030-01-01'), // 未来の日付
      }

      act(() => {
        result.current.setSession(validSession)
      })

      expect(result.current.isSessionExpired()).toBe(false)
    })

    it('should return true for expired session when no session is set', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.isSessionExpired()).toBe(true)
    })

    it('should get remaining session time', () => {
      const { result } = renderHook(() => useAuthStore())

      // 1時間後に期限切れ
      const futureDate = new Date(Date.now() + 60 * 60 * 1000)
      const sessionWithFutureExpiry: UserSession = {
        ...mockSession,
        expiresAt: futureDate,
      }

      act(() => {
        result.current.setSession(sessionWithFutureExpiry)
      })

      const remaining = result.current.getSessionRemainingTime()
      expect(remaining).toBeGreaterThan(0)
      expect(remaining).toBeLessThanOrEqual(60 * 60 * 1000) // 1時間以下
    })

    it('should return 0 for remaining time when session is expired', () => {
      const { result } = renderHook(() => useAuthStore())

      const expiredSession: UserSession = {
        ...mockSession,
        expiresAt: new Date('2020-01-01'),
      }

      act(() => {
        result.current.setSession(expiredSession)
      })

      expect(result.current.getSessionRemainingTime()).toBe(0)
    })

    it('should return 0 for remaining time when no session is set', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.getSessionRemainingTime()).toBe(0)
    })
  })

  describe('ローディングとエラー管理', () => {
    it('should set loading state correctly', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.isLoading).toBe(true)

      act(() => {
        result.current.setLoading(false)
      })

      expect(result.current.isLoading).toBe(false)
    })

    it('should set error correctly', () => {
      const { result } = renderHook(() => useAuthStore())
      const errorMessage = 'Authentication failed'

      act(() => {
        result.current.setError(errorMessage)
      })

      expect(result.current.error).toBe(errorMessage)
    })

    it('should clear error correctly', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setError('Test error')
        result.current.clearError()
      })

      expect(result.current.error).toBeUndefined()
    })
  })

  describe('認証フロー', () => {
    it('should handle login flow correctly', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login(mockSession)
      })

      expect(result.current.session).toEqual(mockSession)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.getIsAuthenticated()).toBe(true)
    })

    it('should handle logout flow correctly', () => {
      const { result } = renderHook(() => useAuthStore())

      // 最初にログイン
      act(() => {
        result.current.login(mockSession)
      })

      expect(result.current.isAuthenticated).toBe(true)

      // ログアウト
      act(() => {
        result.current.logout()
      })

      expect(result.current.session).toBeUndefined()
      expect(result.current.user).toBeUndefined()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.getIsAuthenticated()).toBe(false)
    })

    it('should handle logout when not logged in', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.logout()
      })

      expect(result.current.session).toBeUndefined()
      expect(result.current.user).toBeUndefined()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('ストアリセット', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useAuthStore())

      // ストアの状態を変更
      act(() => {
        result.current.setSession(mockSession)
        result.current.setLoading(true)
        result.current.setError('Test error')
      })

      // リセット実行
      act(() => {
        result.current.resetStore()
      })

      // 初期状態に戻っていることを確認
      expect(result.current.user).toBeUndefined()
      expect(result.current.session).toBeUndefined()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeUndefined()
    })
  })

  describe('トークンアクセス', () => {
    it('should get token correctly', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.getToken()).toBeUndefined()

      act(() => {
        result.current.setSession(mockSession)
      })

      expect(result.current.getToken()).toBe(mockSession.token)
    })

    it('should return undefined for token when no session is set', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.getToken()).toBeUndefined()
    })
  })
})
