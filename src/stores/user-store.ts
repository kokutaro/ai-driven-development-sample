import { create } from 'zustand'

import type { User } from '@/types/todo'

interface UserStore {
  clearUser: () => void
  isAuthenticated: boolean

  reset: () => void
  // Actions
  setUser: (user: User) => void
  updateUser: (data: Partial<User>) => void
  user: undefined | User
}

/**
 * ユーザー状態管理ストア
 *
 * ユーザー情報と認証状態を管理します。
 * - ユーザー情報の設定・更新・クリア
 * - 認証状態の管理
 */
export const useUserStore = create<UserStore>((set, get) => ({
  clearUser: () => set({ isAuthenticated: false, user: undefined }),
  isAuthenticated: false,

  reset: () => set({ isAuthenticated: false, user: undefined }),

  setUser: (user) => set({ isAuthenticated: true, user }),

  updateUser: (data) => {
    const currentUser = get().user
    if (!currentUser) return

    set({ user: { ...currentUser, ...data } })
  },

  user: undefined,
}))
