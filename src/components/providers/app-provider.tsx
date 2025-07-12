'use client'

import { useEffect } from 'react'

import { useSession } from 'next-auth/react'

import type { User } from '@/types/todo'

import { useUserStore } from '@/stores/user-store'

/**
 * アプリケーションプロバイダー
 *
 * アプリケーション全体の初期化処理を行います。
 * - NextAuth.jsセッションとの同期
 * - ユーザー状態の管理
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const { setUser } = useUserStore()

  useEffect(() => {
    if (status === 'loading') {
      return // セッション読み込み中は何もしない
    }

    if (status === 'authenticated' && session?.user) {
      // NextAuth.jsのセッションユーザーをアプリケーションのUserタイプに変換
      const user: User = {
        createdAt: new Date(),
        email: session.user.email ?? '',
        id: session.user.id ?? '',
        image: session.user.image ?? undefined,
        name: session.user.name ?? '',
        updatedAt: new Date(),
      }
      setUser(user)
    } else {
      setUser(undefined)
    }
  }, [session, status, setUser])

  return <>{children}</>
}
