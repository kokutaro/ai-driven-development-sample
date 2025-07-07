'use client'

import { useEffect } from 'react'

import { useUserStore } from '@/stores/user-store'

/**
 * アプリケーションプロバイダー
 *
 * アプリケーション全体の初期化処理を行います。
 * - ユーザー情報の初期化
 * - ハイドレーションエラー対策
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useUserStore()

  useEffect(() => {
    // デモユーザーを設定（ハイドレーションエラー対策）
    setUser({
      createdAt: new Date(),
      email: 'demo@example.com',
      id: 'user-1',
      name: 'デモユーザー',
      updatedAt: new Date(),
    })
  }, [setUser])

  return <>{children}</>
}
