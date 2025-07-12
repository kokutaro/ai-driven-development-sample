'use client'

import { useEffect } from 'react'

import { useUserStore } from '@/stores/user-store'

/**
 * アプリケーションプロバイダー
 *
 * アプリケーション全体の初期化処理を行います。
 * - ユーザー認証状態の初期化
 * - NextAuth.jsセッションとの同期
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const { initializeAuth } = useUserStore()

  useEffect(() => {
    // 認証状態を初期化（NextAuth.jsセッションから実際のユーザー情報を取得）
    void initializeAuth()
  }, [initializeAuth])

  return <>{children}</>
}
