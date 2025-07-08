import { create } from 'zustand'

import type { User } from '@/types/todo'

import { getCurrentUser, isAuthenticated } from '@/lib/auth'

interface UserStore {
  clearUser: () => void
  initializeAuth: () => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
  // Actions
  refreshUser: () => Promise<void>
  reset: () => void
  setUser: (user: User) => void
  updateUser: (data: Partial<User>) => void
  user: undefined | User
}

/**
 * ユーザー状態管理ストア
 *
 * NextAuth.jsとの統合されたユーザー情報と認証状態を管理します。
 * - NextAuth.jsセッションとの同期
 * - ユーザー情報の設定・更新・クリア
 * - 認証状態の管理
 */
export const useUserStore = create<UserStore>((set, get) => ({
  clearUser: () => set({ isAuthenticated: false, user: undefined }),
  initializeAuth: async () => {
    set({ isLoading: true })
    try {
      const [user, authenticated] = await Promise.all([
        getCurrentUser(),
        isAuthenticated(),
      ])

      set({
        isAuthenticated: authenticated,
        isLoading: false,
        user,
      })
    } catch {
      set({
        isAuthenticated: false,
        isLoading: false,
        user: undefined,
      })
    }
  },
  isAuthenticated: false,
  isLoading: true,

  refreshUser: async () => {
    try {
      const [user, authenticated] = await Promise.all([
        getCurrentUser(),
        isAuthenticated(),
      ])

      set({
        isAuthenticated: authenticated,
        user,
      })
    } catch {
      set({
        isAuthenticated: false,
        user: undefined,
      })
    }
  },

  reset: () =>
    set({ isAuthenticated: false, isLoading: true, user: undefined }),

  setUser: (user) => set({ isAuthenticated: true, user }),

  updateUser: (data) => {
    const currentUser = get().user
    if (!currentUser) return

    set({ user: { ...currentUser, ...data } })
  },

  user: undefined,
}))
