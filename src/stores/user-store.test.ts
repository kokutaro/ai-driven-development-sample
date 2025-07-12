import { act, renderHook } from '@testing-library/react'

import { useUserStore } from './user-store'

import type { User } from '@/types/todo'

describe('useUserStore', () => {
  beforeEach(() => {
    // ストアを初期状態にリセット
    useUserStore.getState().reset()
  })

  describe('初期状態', () => {
    it('ユーザーがundefinedに設定されている', () => {
      // Arrange & Act
      const { result } = renderHook(() => useUserStore())

      // Assert
      expect(result.current.user).toBeUndefined()
    })

    it('認証状態がfalseに設定されている', () => {
      // Arrange & Act
      const { result } = renderHook(() => useUserStore())

      // Assert
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('初期状態ではisLoadingがfalseに設定されている', () => {
      // Arrange & Act
      const { result } = renderHook(() => useUserStore())

      // Assert
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('ユーザー設定', () => {
    it('setUserでユーザー情報を設定できる', () => {
      // Arrange
      const mockUser: User = {
        createdAt: new Date(),
        email: 'test@example.com',
        id: 'user-1',
        name: 'テストユーザー',
        updatedAt: new Date(),
      }
      const { result } = renderHook(() => useUserStore())

      // Act
      act(() => {
        result.current.setUser(mockUser)
      })

      // Assert
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('clearUserでユーザー情報をクリアできる', () => {
      // Arrange
      const mockUser: User = {
        createdAt: new Date(),
        email: 'test@example.com',
        id: 'user-1',
        name: 'テストユーザー',
        updatedAt: new Date(),
      }
      const { result } = renderHook(() => useUserStore())

      // Act - ユーザーを設定してからクリア
      act(() => {
        result.current.setUser(mockUser)
      })
      act(() => {
        result.current.clearUser()
      })

      // Assert
      expect(result.current.user).toBeUndefined()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('ユーザー情報更新', () => {
    it('updateUserで一部の情報を更新できる', () => {
      // Arrange
      const mockUser: User = {
        createdAt: new Date(),
        email: 'test@example.com',
        id: 'user-1',
        name: 'テストユーザー',
        updatedAt: new Date(),
      }
      const { result } = renderHook(() => useUserStore())

      // 初期ユーザーを設定
      act(() => {
        result.current.setUser(mockUser)
      })

      // Act
      act(() => {
        result.current.updateUser({ name: '更新されたユーザー' })
      })

      // Assert
      expect(result.current.user?.name).toBe('更新されたユーザー')
      expect(result.current.user?.email).toBe('test@example.com') // 他の情報は保持
      expect(result.current.user?.id).toBe('user-1')
    })

    it('ユーザーがundefinedの場合はupdateUserが何もしない', () => {
      // Arrange
      const { result } = renderHook(() => useUserStore())

      // Act
      act(() => {
        result.current.updateUser({ name: '更新されたユーザー' })
      })

      // Assert
      expect(result.current.user).toBeUndefined()
    })
  })

  describe('認証状態', () => {
    it('ユーザーが設定されている場合、isAuthenticatedがtrueになる', () => {
      // Arrange
      const mockUser: User = {
        createdAt: new Date(),
        email: 'test@example.com',
        id: 'user-1',
        name: 'テストユーザー',
        updatedAt: new Date(),
      }
      const { result } = renderHook(() => useUserStore())

      // Act
      act(() => {
        result.current.setUser(mockUser)
      })

      // Assert
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('ユーザーがundefinedの場合、isAuthenticatedがfalseになる', () => {
      // Arrange
      const { result } = renderHook(() => useUserStore())

      // Act (明示的にundefinedを設定)
      act(() => {
        result.current.clearUser()
      })

      // Assert
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('undefinedを設定した場合、認証状態がクリアされる', () => {
      // Arrange
      const mockUser: User = {
        createdAt: new Date(),
        email: 'test@example.com',
        id: 'user-1',
        name: 'テストユーザー',
        updatedAt: new Date(),
      }
      const { result } = renderHook(() => useUserStore())

      // 最初にユーザーを設定
      act(() => {
        result.current.setUser(mockUser)
      })

      // Act - undefinedを設定
      act(() => {
        result.current.setUser(undefined)
      })

      // Assert
      expect(result.current.user).toBeUndefined()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })
})
