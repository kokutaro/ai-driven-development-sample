/**
 * 認証ストア
 * @fileoverview Zustandを使用した認証状態管理
 */
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import type { UpdateUserInput, User, UserSession } from '@/types/user'

/**
 * 認証ストアの型定義
 */
type AuthStore = AuthStoreActions & AuthStoreComputed & AuthStoreState

/**
 * 認証ストアのアクションの型定義
 */
interface AuthStoreActions {
  /**
   * エラーをクリア
   */
  clearError: () => void

  /**
   * セッションをクリア
   */
  clearSession: () => void

  /**
   * ユーザーをクリア
   */
  clearUser: () => void

  /**
   * ログイン
   * @param session セッション情報
   */
  login: (session: UserSession) => void

  /**
   * ログアウト
   */
  logout: () => void

  /**
   * ストアを初期状態にリセット
   */
  resetStore: () => void

  /**
   * エラーを設定
   * @param error エラーメッセージ
   */
  setError: (error: string) => void

  /**
   * ローディング状態を設定
   * @param loading ローディング状態
   */
  setLoading: (loading: boolean) => void

  /**
   * セッションを設定
   * @param session セッション情報
   */
  setSession: (session: UserSession) => void

  /**
   * ユーザーを設定
   * @param user ユーザー情報
   */
  setUser: (user: User) => void

  /**
   * ユーザー情報を更新
   * @param updates 更新内容
   */
  updateUser: (updates: UpdateUserInput) => void
}

/**
 * 計算されたプロパティの型定義
 */
interface AuthStoreComputed {
  /**
   * 認証済みかどうかを取得
   * @returns 認証済みかどうか
   */
  getIsAuthenticated: () => boolean

  /**
   * セッションの残り時間を取得（ミリ秒）
   * @returns 残り時間（期限切れまたはセッションがない場合は0）
   */
  getSessionRemainingTime: () => number

  /**
   * トークンを取得
   * @returns JWTトークン（セッションがない場合はundefined）
   */
  getToken: () => string | undefined

  /**
   * ユーザーメールアドレスを取得
   * @returns メールアドレス（ログインしていない場合はundefined）
   */
  getUserEmail: () => string | undefined

  /**
   * ユーザーIDを取得
   * @returns ユーザーID（ログインしていない場合はundefined）
   */
  getUserId: () => string | undefined

  /**
   * ユーザー名を取得
   * @returns ユーザー名（ログインしていない場合やnameが設定されていない場合はundefined）
   */
  getUserName: () => string | undefined

  /**
   * セッションが期限切れかどうかを確認
   * @returns 期限切れかどうか
   */
  isSessionExpired: () => boolean
}

/**
 * 認証ストアの状態の型定義
 */
interface AuthStoreState {
  /**
   * エラーメッセージ
   */
  error?: string

  /**
   * 認証済みかどうか
   */
  isAuthenticated: boolean

  /**
   * ローディング状態
   */
  isLoading: boolean

  /**
   * セッション情報
   */
  session?: UserSession

  /**
   * 現在のユーザー
   */
  user?: User
}

/**
 * 初期状態
 */
const initialState: AuthStoreState = {
  error: undefined,
  isAuthenticated: false,
  isLoading: false,
  session: undefined,
  user: undefined,
}

/**
 * 認証ストア
 */
export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      // 初期状態
      ...initialState,

      clearError: () =>
        set({ error: undefined }, false, 'authStore/clearError'),

      clearSession: () =>
        set(
          {
            isAuthenticated: false,
            session: undefined,
            user: undefined,
          },
          false,
          'authStore/clearSession'
        ),

      clearUser: () => set({ user: undefined }, false, 'authStore/clearUser'),

      // 計算されたプロパティ（関数版）
      getIsAuthenticated: () => {
        const { session } = get()
        return !!session
      },

      getSessionRemainingTime: () => {
        const { session } = get()
        if (!session) return 0
        const remaining = session.expiresAt.getTime() - Date.now()
        return Math.max(0, remaining)
      },

      getToken: () => {
        const { session } = get()
        return session?.token
      },

      getUserEmail: () => {
        const { user } = get()
        return user?.email
      },

      getUserId: () => {
        const { user } = get()
        return user?.id
      },

      getUserName: () => {
        const { user } = get()
        return user?.name
      },

      isSessionExpired: () => {
        const { session } = get()
        if (!session) return true
        return new Date() > session.expiresAt
      },

      login: (session) =>
        set(
          {
            isAuthenticated: true,
            session,
            user: session.user,
          },
          false,
          'authStore/login'
        ),

      logout: () =>
        set(
          {
            isAuthenticated: false,
            session: undefined,
            user: undefined,
          },
          false,
          'authStore/logout'
        ),

      resetStore: () => set(initialState, false, 'authStore/resetStore'),

      setError: (error) => set({ error }, false, 'authStore/setError'),

      setLoading: (isLoading) =>
        set({ isLoading }, false, 'authStore/setLoading'),

      setSession: (session) =>
        set(
          {
            isAuthenticated: true,
            session,
            user: session.user,
          },
          false,
          'authStore/setSession'
        ),

      // アクション
      setUser: (user) => set({ user }, false, 'authStore/setUser'),

      updateUser: (updates) =>
        set(
          (state) => {
            if (!state.user) return state
            return {
              user: {
                ...state.user,
                ...updates,
                updatedAt: new Date(),
              },
            }
          },
          false,
          'authStore/updateUser'
        ),
    }),
    {
      name: 'auth-store',
    }
  )
)
