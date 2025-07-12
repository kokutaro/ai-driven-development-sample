import { create } from 'zustand'

import type { User } from '@/types/todo'

interface UserStore {
  clearUser: () => void
  isAuthenticated: boolean
  isLoading: boolean
  // Actions
  reset: () => void
  setUser: (user: undefined | User) => void
  updateUser: (data: Partial<User>) => void
  user: undefined | User
}

/**
 * ユーザー状態管理ストア
 *
 * ユーザー情報と認証状態を管理します。
 * - NextAuth.jsのuseSessionフックと連携
 * - ユーザー情報の設定・更新・クリア
 * - 認証状態の管理
 */
export const useUserStore = create<UserStore>((set, get) => ({
  clearUser: () => set({ isAuthenticated: false, user: undefined }),
  isAuthenticated: false,
  isLoading: false,

  reset: () =>
    set({ isAuthenticated: false, isLoading: false, user: undefined }),

  setUser: (user) => {
    if (user) {
      set({ isAuthenticated: true, user })
    } else {
      set({ isAuthenticated: false, user: undefined })
    }

    // デバッグ用（開発時のみ）
    if (process.env.NODE_ENV === 'development') {
      console.log('UserStore - User set:', { isAuthenticated: !!user, user })
    }
  },

  updateUser: (data) => {
    const currentUser = get().user
    if (!currentUser) return

    set({ user: { ...currentUser, ...data } })
  },

  user: undefined,
}))
